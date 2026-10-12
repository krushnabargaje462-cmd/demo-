import {watchHistory,watchCycles,watchBattery,text} from './live-data.js';
function clock(){text('clock',new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))}
clock();setInterval(clock,1000);

const specs=[['voltageChart','Pack Voltage (V)','voltage'],['currentChart','Current (A)','current'],['tempChart','Battery Temperature (°C)','batteryTemperature'],['deltaChart','Cell Difference (V)','cellDifference']];
const charts={};
specs.forEach(([id,label,key])=>{
  charts[key]=new Chart(document.getElementById(id),{
    type:'line',
    data:{labels:[],datasets:[{label,data:[],borderColor:'#19b9ff',backgroundColor:'rgba(25,185,255,.08)',fill:true,tension:.25,pointRadius:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#71808d'},grid:{color:'#1b242c'}},y:{ticks:{color:'#71808d'},grid:{color:'#1b242c'}}}}
  });
});

function analyse(rows){
  if(!rows.length)return;
  const currents=rows.map(r=>Number(r.current)).filter(Number.isFinite);
  const socs=rows.map(r=>Number(r.soc)).filter(Number.isFinite);
  const temps=rows.map(r=>Number(r.batteryTemperature)).filter(Number.isFinite);
  const deltas=rows.map(r=>Number(r.cellDifference)).filter(Number.isFinite);

  const charging=currents.filter(x=>x>0.05).length;
  const discharging=currents.filter(x=>x<-0.05).length;
  const idle=currents.length-charging-discharging;
  const avgSoc=socs.length?socs.reduce((a,b)=>a+b,0)/socs.length:null;
  const avgTemp=temps.length?temps.reduce((a,b)=>a+b,0)/temps.length:null;
  const maxDelta=deltas.length?Math.max(...deltas):null;

  document.getElementById('usageSummary').innerHTML=
    `<div class="analytics-stat">Charging observations <strong>${charging}</strong></div>
     <div class="analytics-stat">Discharging observations <strong>${discharging}</strong></div>
     <div class="analytics-stat">Idle observations <strong>${idle}</strong></div>
     <div class="analytics-stat">Average SOC <strong>${avgSoc==null?'--':avgSoc.toFixed(1)+'%'}</strong></div>
     <div class="analytics-stat">Average temperature <strong>${avgTemp==null?'--':avgTemp.toFixed(1)+' °C'}</strong></div>`;

  const s=[];
  if(avgSoc!=null && avgSoc<30)s.push('Your recorded usage often reaches a low SOC range. Consider avoiding repeated deep discharge.');
  if(avgSoc!=null && avgSoc>90 && charging>0)s.push('Charging observations occur at high SOC. Monitor time spent near the upper SOC range.');
  if(avgTemp!=null && avgTemp>40)s.push('History contains elevated battery temperature. Review thermal conditions during those sessions.');
  if(maxDelta!=null && maxDelta>=0.08)s.push(`A historical cell imbalance reached ${(maxDelta*1000).toFixed(0)} mV. Inspect the lowest cell and continue monitoring.`);
  if(!s.length)s.push('No strong usage warning is available yet. More history will make the suggestions more meaningful.');
  document.getElementById('usageSuggestions').innerHTML='<ul>'+s.map(x=>`<li>${x}</li>`).join('')+'</ul>';
}

watchHistory(raw=>{
  const rows=Object.values(raw).sort((a,b)=>Number(a.timestamp||0)-Number(b.timestamp||0)).slice(-200);
  const labels=rows.map(r=>new Date(Number(r.timestamp||0)*1000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}));
  specs.forEach(([, ,key])=>{charts[key].data.labels=labels;charts[key].data.datasets[0].data=rows.map(r=>r[key]??null);charts[key].update('none')});
  analyse(rows);
});

watchCycles(raw=>{
  const rows=Object.values(raw).sort((a,b)=>Number(a.cycleNumber||0)-Number(b.cycleNumber||0));
  const el=document.getElementById('cycleSummary');
  el.textContent=rows.length?`Recorded cycles: ${rows.length}. Latest BMS cycle: ${rows.at(-1)?.cycleNumber??'--'}.`:'No cycle records yet.';
});

watchBattery(b=>{
  const el=document.getElementById('sohSummary');
  el.textContent=b.soh==null?'SOH baseline not available.':'Measured SOH: '+Number(b.soh).toFixed(1)+'%';
});
