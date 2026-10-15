import admin from 'firebase-admin';
import {timingSafeEqual} from 'node:crypto';
const MASTER=(process.env.MASTER_ADMIN_EMAIL||'leandrodevxx@gmail.com').toLowerCase();
const RTDB_URL='https://projetoinspecao-41fb8-default-rtdb.firebaseio.com';
const ROOT='wmoldes/v2';
function initialize(){if(admin.apps.length)return admin.app();const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!raw)throw Error('FIREBASE_SERVICE_ACCOUNT_JSON ausente no Netlify.');let credentials;try{credentials=JSON.parse(raw)}catch{throw Error('FIREBASE_SERVICE_ACCOUNT_JSON inválido.')}
if(!credentials.private_key||!credentials.client_email||credentials.project_id!=='projetoinspecao-41fb8')throw Error('Conta de serviço incompleta ou de outro projeto.');return admin.initializeApp({credential:admin.credential.cert(credentials),databaseURL:RTDB_URL});}
const output=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>output({error:message},status);
const sameSecret=(a,b)=>{const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length>12&&aa.length===bb.length&&timingSafeEqual(aa,bb)};
const str=(v,max)=>String(v??'').trim().slice(0,max);
async function roleOf(u){const claims=u.customClaims||{};return claims.admin===true?'admin':claims.writer===true?'writer':'viewer'}
async function listAll(){let token,users=[];do{const r=await admin.auth().listUsers(1000,token);users.push(...r.users);token=r.pageToken}while(token&&users.length<5000);return users}
export default async function handler(request){if(request.method!=='POST')return fail('Método não permitido',405);
let data;try{data=await request.json()}catch{return fail('JSON inválido')}
try{initialize()}catch(e){return fail(e.message,503)}
const rawToken=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!rawToken)return fail('Token não informado',401);
let decoded;try{decoded=await admin.auth().verifyIdToken(rawToken,true)}catch{return fail('Sessão inválida ou revogada',401)}
let me;try{me=await admin.auth().getUser(decoded.uid)}catch{return fail('Usuário não encontrado',401)}
if(me.disabled)return fail('Conta bloqueada',403);
if(data.action==='bootstrap'){
 if(me.email?.toLowerCase()!==MASTER)return fail('Conta não autorizada para ativação',403);
 if(!me.emailVerified)return fail('Verifique seu e-mail antes da ativação',403);
 if(!process.env.WM_BOOTSTRAP_SECRET)return fail('Configure WM_BOOTSTRAP_SECRET nas variáveis do Netlify',503);
 if(!sameSecret(data.setupSecret,process.env.WM_BOOTSTRAP_SECRET))return fail('Segredo inválido',403);
 await admin.auth().setCustomUserClaims(me.uid,{...(me.customClaims||{}),admin:true,writer:true});
 return output({ok:true,uid:me.uid});
}
if(me.customClaims?.admin!==true||decoded.admin!==true)return fail('Apenas administradores podem executar esta ação',403);
try{
 switch(data.action){
 case 'listUsers':{
  const users=await listAll();return output({users:users.map(u=>({uid:u.uid,email:u.email||'',name:u.displayName||'',disabled:u.disabled,role:u.customClaims?.admin?'admin':u.customClaims?.writer?'writer':'viewer',lastSignInTime:u.metadata.lastSignInTime||null,createdAt:u.metadata.creationTime||null,emailVerified:u.emailVerified}))});
 }
 case 'createUser':{
  const email=str(data.email,254).toLowerCase(),displayName=str(data.displayName,80),password=String(data.password||''),role=data.role;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8||!['viewer','writer','admin'].includes(role))return fail('Informe e-mail válido, senha de pelo menos 8 caracteres e permissão válida.');
  if(email===MASTER)return fail('A conta principal deve ser cadastrada pelo processo seguro de ativação.',403);
  const u=await admin.auth().createUser({email,displayName,password,emailVerified:false,disabled:false});
  try{await admin.auth().setCustomUserClaims(u.uid,{admin:role==='admin',writer:role==='writer'||role==='admin'});}catch(e){await admin.auth().deleteUser(u.uid);throw e}
  return output({ok:true,uid:u.uid});
 }
 case 'updateRole':{
  const uid=str(data.uid,160),role=data.role;if(!['viewer','writer','admin'].includes(role))return fail('Permissão inválida.');
  const u=await admin.auth().getUser(uid);
  if(u.email?.toLowerCase()===MASTER&&role!=='admin')return fail('O administrador principal não pode perder acesso por este painel.',403);
  const claim={...(u.customClaims||{}),admin:role==='admin',writer:role==='writer'||role==='admin'};await admin.auth().setCustomUserClaims(uid,claim);await admin.auth().revokeRefreshTokens(uid);
  return output({ok:true});
 }
 case 'setDisabled':{
  const uid=str(data.uid,160),disabled=data.disabled===true,u=await admin.auth().getUser(uid);
  if(u.email?.toLowerCase()===MASTER&&disabled)return fail('A conta principal não pode ser bloqueada aqui.',403);
  if(uid===me.uid&&disabled)return fail('Você não pode bloquear sua própria conta.',403);
  await admin.auth().updateUser(uid,{disabled});if(disabled)await admin.auth().revokeRefreshTokens(uid);return output({ok:true});
 }
 case 'passwordResetLink':{
  const uid=str(data.uid,160),u=await admin.auth().getUser(uid);if(!u.email)return fail('Usuário sem e-mail cadastrado');
  const url=await admin.auth().generatePasswordResetLink(u.email);return output({ok:true,url});
 }
 case 'sendMessage':{
  const uid=str(data.toUid,160),subject=str(data.subject,120),body=str(data.body,3000);if(!subject||!body)return fail('Preencha assunto e mensagem.');
  await admin.auth().getUser(uid);
  const message={subject,body,senderUid:me.uid,senderEmail:me.email||'Administrador',sentAt:new Date().toISOString()};await admin.database().ref(`${ROOT}/private/messages/${uid}`).push(message);return output({ok:true});
 }
 case 'usage':{
  const snap=await admin.database().ref(`${ROOT}/public`).once('value'),publicData=snap.val()||{},machineMap=publicData.machines||{},inspectionsMap=publicData.inspections||{};
  let inspections=0;for(const days of Object.values(inspectionsMap))for(const recs of Object.values(days||{}))inspections+=Object.keys(recs||{}).length;
  const logicalBytes=Buffer.byteLength(JSON.stringify(publicData),'utf8');return output({logicalBytes,inspections,machines:Object.keys(machineMap).length,measuredAt:new Date().toISOString(),scope:`${ROOT}/public`,note:'Aproximação do JSON lógico, não corresponde ao armazenamento faturado nem ao tráfego de download.'});
 }
 default:return fail('Ação não reconhecida',404);
 }
}catch(err){const code=err?.code||'';const safe=code==='auth/email-already-exists'?'E-mail já cadastrado.':code==='auth/user-not-found'?'Usuário não encontrado.':code==='auth/invalid-password'?'Senha inválida.':'Falha da operação administrativa. Confira configurações e logs do Netlify.';console.error('WM_ADMIN_ERROR',data.action,code,err.message);return fail(safe,500)}
}
