// Wait after the last award, not after the first table contact.
export const RESULT_WAIT_MS=3000;
export const AUTO_ASSEMBLY_MS=1600;
export function createRestackSchedule(){let due=Infinity;return{schedule(now){due=now+RESULT_WAIT_MS},clear(){due=Infinity},ready(now,{result,paused=false}){if(!result){due=Infinity;return false}if(paused){due=now+RESULT_WAIT_MS;return false}if(now<due)return false;due=Infinity;return true}}}
