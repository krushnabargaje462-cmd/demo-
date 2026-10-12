import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

export const liveRef=ref(db,"missionTitan/live");
export const batteryRef=ref(db,"missionTitan/battery");
export const historyRef=ref(db,"missionTitan/history");
export const cyclesRef=ref(db,"missionTitan/cycles");

export function fmt(v,d=2,s=""){if(v===null||v===undefined||v==="")return "--";const n=Number(v);return Number.isFinite(n)?`${n.toFixed(d)}${s}`:"--"}
export function text(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
export function operationClass(op){return op==="CHARGING"?"charging":op==="DISCHARGING"?"discharging":"idle"}
export function cellStatus(v,min,max){if(v==null||min==null||max==null)return ["","--"];const d=Number(max)-Number(min),x=Number(v);if(d>=.08&&Math.abs(x-Number(min))<.005)return ["red","Critical"];if(d>=.03&&Math.abs(x-Number(min))<.01)return ["yellow","Imbalance"];return ["green","Healthy"]}
export function watchLive(cb){onValue(liveRef,s=>cb(s.val()||{}))}
export function watchBattery(cb){onValue(batteryRef,s=>cb(s.val()||{}))}
export function watchHistory(cb){onValue(historyRef,s=>cb(s.val()||{}))}
export function watchCycles(cb){onValue(cyclesRef,s=>cb(s.val()||{}))}
