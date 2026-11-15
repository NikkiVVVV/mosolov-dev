import {createCollectionShare} from './share-card.js?v=20261115-share52';
import {getLanguage,t,onLanguageChange} from './i18n.js';
import {renderLedLabel} from './led-label.js';
export function createCollectionShareUI({button,getItems,ensureItem,imageFor,urlFor,isOpen,platform}){
 let busy=false;
 function label(){button.disabled=busy;button.setAttribute('aria-busy',String(busy));renderLedLabel(button,busy?t('preparing'):t('share'),{animate:true})}
 const controller=createCollectionShare({getItems,ensureItem,imageFor,urlFor,getLanguage,platform,onBusy:value=>{busy=value;label()}});
 function prepare(){label();return controller.prepare().catch(()=>{busy=false;label();renderLedLabel(button,t('retry'))})}
 async function fallback(data){const url=URL.createObjectURL(data.file),a=document.createElement('a');a.href=url;a.download=data.file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);try{await navigator.clipboard.writeText(data.text)}catch{}}
 button.onclick=()=>{const data=controller.ready();if(!data){prepare();return}if(controller.canShare(data))controller.share().catch(error=>{if(error.name!=='AbortError')fallback(data)});else fallback(data)};
 onLanguageChange(()=>{label();if(isOpen())prepare()});label();return{prepare};
}
