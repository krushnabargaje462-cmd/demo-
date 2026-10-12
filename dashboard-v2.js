import {watchLive,fmt,text} from './live-data.js';

function clock(){
  text('clock',new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
}
clock(); setInterval(clock,1000);

const cells=document.getElementById('cells');

function getOperation(d){
  if (d.operationStatus) return String(d.operationStatus);
  const current=Number(d.current);
  if (!Number.isFinite(current)) return 'NO DATA';
  if (current > 0.05) return 'CHARGING';
  if (current < -0.05) return 'DISCHARGING';
  return 'IDLE';
}

function formatProtection(value){
  if(value===null || value===undefined || value==='') return '--';
  const n=Number(value);
  return Number.isFinite(n) ? (n===0 ? 'None' : String(n)) : String(value);
}

watchLive(d=>{
  const operation=getOperation(d);

  text('soc',fmt(d.soc,0,'%'));
  text('voltage',fmt(d.voltage,2,' V'));
  text('bmsVoltage',fmt(d.bmsVoltage,2,' V'));
  text('current',fmt(d.current,3,' A'));
  text('bmsCurrent',fmt(d.bmsCurrent,3,' A'));
  text('power',fmt(d.power,2,' W'));
  text('operation',operation);
  text('batteryTemp',fmt(d.batteryTemperature,1,' °C'));
  text('bmsTemp',fmt(d.bmsTemperature,1,' °C'));
  text('jbdTemp',fmt(d.jbdBmsTemperature,1,' °C'));
  text('cycles',fmt(d.cycles,0,''));
  text('min',fmt(d.minCellVoltage,3,' V'));
  text('max',fmt(d.maxCellVoltage,3,' V'));
  text('cellDiff',fmt(d.cellDifference,3,' V'));
  text('protection',formatProtection(d.protection));
  text('fetStatus',d.fetStatus==null?'--':String(d.fetStatus));

  const opEl=document.getElementById('operation');
  opEl.className=`value ${operation.toLowerCase()==='charging'?'charging':operation.toLowerCase()==='discharging'?'discharging':'idle'}`;

  const conn=document.getElementById('connection');
  conn.textContent=d.bmsConnected?'BMS Connected':'BMS Offline';
  conn.className=`status-dot ${d.bmsConnected?'online':'offline'}`;

  const bs=document.getElementById('bmsStatus');
  bs.textContent=d.bmsConnected?'Connected':'Offline';
  bs.className=d.bmsConnected?'charging':'discharging';

  cells.innerHTML='';
  for(let i=1;i<=4;i++){
    const v=d[`cell${i}Voltage`];
    const n=Number(v);
    const min=Number(d.minCellVoltage);
    const max=Number(d.maxCellVoltage);
    const delta=max-min;
    const valid=Number.isFinite(n)&&Number.isFinite(min)&&Number.isFinite(max);
    const isLowest=valid && Math.abs(n-min)<0.001;
    const critical=valid && delta>=0.08 && isLowest;
    const warning=valid && delta>=0.03 && isLowest && !critical;
    const badgeClass=critical?'red':warning?'yellow':'green';
    const badgeText=critical?'Critical':warning?'Imbalance':'Healthy';

    const c=document.createElement('div');
    c.className='card cell-card';
    c.innerHTML=`<h3>Cell ${i}</h3>
      <div class="value">${fmt(v,3,' V')}</div>
      <span class="badge ${badgeClass}">${v==null?'Waiting':badgeText}</span>`;
    cells.appendChild(c);
  }

  const a=document.getElementById('alert');
  const delta=Number(d.cellDifference);
  if(!Number.isFinite(delta)) {
    a.textContent='Waiting for live telemetry.';
  } else if(delta>=.08) {
    a.innerHTML=`<span class="badge red">High attention</span> Cell voltage difference: ${delta.toFixed(3)} V. Lowest cell: ${fmt(d.minCellVoltage,3,' V')}.`;
  } else if(delta>=.03) {
    a.innerHTML=`<span class="badge yellow">Monitor</span> Cell voltage difference: ${delta.toFixed(3)} V.`;
  } else {
    a.innerHTML=`<span class="badge green">Normal</span> Cell voltage difference: ${delta.toFixed(3)} V.`;
  }
});
