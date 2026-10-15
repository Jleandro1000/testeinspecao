import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getDatabase,ref,onValue,off,get,set,remove,push,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,sendEmailVerification,getIdTokenResult} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {firebaseConfig,APP_ROOT} from './firebase-config.js';
const app=initializeApp(firebaseConfig),db=getDatabase(app),auth=getAuth(app);
const path=(p)=>ref(db,APP_ROOT+'/'+p);
export const firebase={
  auth,
  subscribe(p,success,fail){return onValue(path(p),s=>success(s.val()),err=>fail?.(err));},
  read:async p=>(await get(path(p))).val(),
  write:(p,data)=>set(path(p),data),
  delete:p=>remove(path(p)),
  newKey:p=>push(path(p)).key,
  serverTimestamp,
  async uploadDrawing(key,file){
    const {getStorage,ref:storageRef,uploadBytes,getDownloadURL}=await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js');
    const ext=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':file.type==='image/jpeg'?'jpg':file.type==='image/webp'?'webp':file.type==='image/gif'?'gif':file.type==='image/bmp'?'bmp':null;
    if(!ext)throw Error('Formato de arquivo não suportado.');
    if(file.size>20*1024*1024)throw Error('Arquivo maior que 20 MB.');
    const target=storageRef(getStorage(app),`wmoldes/drawings/${key}/${crypto.randomUUID()}.${ext}`);
    await uploadBytes(target,file,{contentType:file.type,customMetadata:{prefixKey:key,ownerUid:auth.currentUser?.uid||''}});
    return {url:await getDownloadURL(target),fullPath:target.fullPath};
  },
  authListener:onAuthStateChanged,
  login:(email,password)=>signInWithEmailAndPassword(auth,email,password),
  logout:()=>signOut(auth),
  forgot:email=>sendPasswordResetEmail(auth,email),
  verifyEmail:u=>sendEmailVerification(u),
  tokenDetails:u=>getIdTokenResult(u,true),
  async admin(action,payload={}){
    const token=await auth.currentUser?.getIdToken();
    if(!token)throw Error('É necessário estar conectado.');
    const response=await fetch('/.netlify/functions/admin',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({action,...payload})
    });
    let result;try{result=await response.json()}catch{throw Error('Função administrativa indisponível. Publique com Netlify Functions.');}
    if(!response.ok)throw Error(result.error||'Falha no servidor administrativo.');
    return result;
  }
};
