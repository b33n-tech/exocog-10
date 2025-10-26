const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksContainer = document.getElementById("tasksContainer");
const clearBtn = document.getElementById("clearBtn");
const archiveBtn = document.getElementById("archiveBtn");
const generateJSONBtn = document.getElementById("generateJSONBtn");
const llmSelect = document.getElementById("llmSelect");
const jsonPaste = document.getElementById("jsonPaste");
const pushJSONBtn = document.getElementById("pushJSONBtn");
const restoreBtn = document.getElementById("restoreBtn");
const restoreInput = document.getElementById("restoreInput");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function formatDate(iso){ const d = new Date(iso); return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`; }

function renderTasks(){
  tasksContainer.innerHTML="";
  tasks.forEach((task,i)=>{
    const li = document.createElement("li");
    const taskDiv = document.createElement("div");
    taskDiv.textContent = task.text; taskDiv.style.cursor="pointer";

    const commentBlock = document.createElement("div");
    commentBlock.className="comment-section"; commentBlock.style.display="flex";

    const commentList = document.createElement("ul");
    if(task.comments?.length){
      task.comments.forEach(c=>{
        const liC = document.createElement("li");
        liC.textContent=`[${formatDate(c.date)}] ${c.text}`;
        commentList.appendChild(liC);
      });
    }
    commentBlock.appendChild(commentList);

    const commentInputDiv = document.createElement("div");
    commentInputDiv.className="comment-input";
    const commentInput = document.createElement("input");
    commentInput.placeholder="Ajouter un commentaire…";
    const commentBtn = document.createElement("button");
    commentBtn.textContent="+";
    commentBtn.addEventListener("click", ()=>{
      const val = commentInput.value.trim();
      if(val!==""){
        if(!task.comments) task.comments=[];
        task.comments.push({text:val,date:new Date().toISOString()});
        localStorage.setItem("tasks",JSON.stringify(tasks));
        commentInput.value="";
        renderTasks();
      }
    });
    commentInputDiv.appendChild(commentInput); commentInputDiv.appendChild(commentBtn);
    commentBlock.appendChild(commentInputDiv);

    li.appendChild(taskDiv); li.appendChild(commentBlock);
    tasksContainer.appendChild(li);
  });
}

addBtn.addEventListener("click", ()=>{
  const text = taskInput.value.trim();
  if(text!==""){ tasks.push({text,comments:[]}); localStorage.setItem("tasks",JSON.stringify(tasks)); taskInput.value=""; renderTasks();}
});

clearBtn.addEventListener("click", ()=>{
  if(confirm("Es-tu sûr ?")){ tasks=[]; localStorage.removeItem("tasks"); renderTasks(); }
});

archiveBtn.addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(tasks,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;
  a.download=`tasks_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});

restoreBtn.addEventListener("click",()=>restoreInput.click());
restoreInput.addEventListener("change", event=>{
  const file=event.target.files[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=e=>{
    try{ const data=JSON.parse(e.target.result); tasks=data; localStorage.setItem("tasks",JSON.stringify(tasks)); renderTasks(); alert("✅ JSON restauré"); }catch(err){alert("❌ Impossible de lire le JSON");}
  }; reader.readAsText(file);
});

generateJSONBtn.addEventListener("click", ()=>{
  const jsonStr=JSON.stringify(tasks,null,2); navigator.clipboard.writeText(jsonStr).then(()=>{ alert("✅ JSON copié dans le presse-papier"); });
  jsonPaste.value=jsonStr;
});

pushJSONBtn.addEventListener("click", ()=>{
  const data=jsonPaste.value.trim();
  if(!data){ alert("Collez un JSON valide !"); return; }
  try{ const parsed=JSON.parse(data); populateModules(parsed); alert("✅ Modules mis à jour"); }catch(e){ alert("❌ JSON invalide"); }
});

renderTasks();
