const timeline=document.getElementById('timeline');
const form=document.getElementById('pblForm');
const entries=[];

form.addEventListener('submit',e=>{
  e.preventDefault();
  const entry={
    teacher:teacher.value,
    course:course.value,
    title:title.value,
    start:new Date(startDate.value),
    end:new Date(endDate.value)
  };
  entries.push(entry);
  render();
  form.reset();
});

function render(){
  timeline.innerHTML='';
  entries.forEach(e=>{
    const row=document.createElement('div');row.className='row';
    const track=document.createElement('div');track.className='track';
    const grid=document.createElement('div');grid.className='grid';
    for(let i=0;i<24;i++)grid.appendChild(document.createElement('div'));
    const bar=document.createElement('div');bar.className='bar science';
    bar.style.left='20%';bar.style.width='40%';
    bar.textContent=`${e.title} • ${e.start.toLocaleDateString()}–${e.end.toLocaleDateString()}`;
    track.append(grid,bar);row.append(track);timeline.append(row);
  });
}
