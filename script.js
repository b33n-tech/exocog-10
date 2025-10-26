// --- Elements ---
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const archiveBtn = document.getElementById("archiveBtn");
const tasksContainer = document.getElementById("tasksContainer");
const copiedMsg = document.getElementById("copiedMsg");
const clearBtn = document.getElementById("clearBtn");
const restoreBtn = document.getElementById("restoreBtn");
const restoreInput = document.getElementById("restoreInput");
const promptsContainer = document.getElementById("promptsContainer");
const llmSelect = document.getElementById("llmSelect");
const jsonPaste = document.getElementById("jsonPaste");
const pushJsonBtn = document.getElementById("pushJsonBtn");

// --- Modules ---
const jalonsList = document.getElementById("jalonsList");
const messagesTableBody = document.querySelector("#messagesTable tbody");
const livrablesList = document.getElementById("livrablesList");
const generateMailBtn = document.getElementById("generateMailBtn");
const mailPromptSelect = document.getElementById("mailPromptSelect");
const generateLivrableBtn = document.getElementById("generateLivrableBtn");
const livrablePromptSelect = document.getElementById("livrablePromptSelect");

// --- Tasks storage ---
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let llmData = null;

// --- Utils ---
function formatDate(iso){const d=new Date(iso);return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}

// --- Render Tasks ---
function renderTasks(){
  tasksContainer.innerHTML="";
  tasks.slice().sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach((task,i)=>{
    const li=document.createElement("li");
    li.className="task-item";

    const taskText=document.createElement("div");
    taskText.className="task-text";
    taskText.textContent=task.text + " (ajoutée le "+task.date.split("T")[0]+")";

    const commentBlock=document.createElement("div");
    commentBlock.className="comment-section";
    commentBlock.style.display="flex";

    const commentList=document.createElement("ul");
    if(task.comments?.length){
      task.comments.forEach(c=>{
        const cLi=document.createElement("li");
        cLi.textContent=`[${formatDate(c.date)}] ${c.text}`;
        commentList.appendChild(cLi);
      });
    }
    commentBlock.appendChild(commentList);

    const commentInputDiv=document.createElement("div");
    commentInputDiv.className="comment-input";
    const commentInput=document.createElement("input");
    commentInput.placeholder="Ajouter un commentaire…";
    const commentBtn=document.createElement("button");
    commentBtn.textContent="+";
    commentBtn.addEventListener("click", ()=>{
      const val=commentInput.value.trim();
      if(val!==""){
        if(!task.comments) task.comments=[];
        task.comments.push({text:val,date:new Date().toISOString()});
        localStorage.setItem("tasks",JSON.stringify(tasks));
        commentInput.value="";
        renderTasks();
      }
    });
    commentInputDiv.appendChild(commentInput);
    commentInputDiv.appendChild(commentBtn);
    commentBlock.appendChild(commentInputDiv);

    li.appendChild(taskText);
    li.appendChild(commentBlock);
    tasksContainer.appendChild(li);
  });
}

// --- Add Task ---
addBtn.addEventListener("click",()=>{
  const text=taskInput.value.trim();
  if(text!==""){
    tasks.push({text,date:new Date().toISOString(),comments:[]});
    localStorage.setItem("tasks",JSON.stringify(tasks));
    taskInput.value="";
    renderTasks();
  }
});

// --- Clear Tasks ---
clearBtn.addEventListener("click",()=>{
  if(confirm("Es-tu sûr ? Cette action est irréversible !")){
    tasks=[];
    localStorage.removeItem("tasks");
    renderTasks();
    alert("✅ Toutes les tâches ont été supprimées.");
  }
});

// --- Archive Tasks ---
archiveBtn.addEventListener("click",()=>{
  if(tasks.length===0){alert("Aucune tâche à archiver !");return;}
  const blob=new Blob([JSON.stringify(tasks,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`taches_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// --- Restore JSON ---
restoreBtn.addEventListener("click",()=>restoreInput.click());
restoreInput.addEventListener("change",event=>{
  const files=Array.from(event.target.files);
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=JSON.parse(e.target.result);
        if(Array.isArray(data)) tasks=[...tasks,...data];
        localStorage.setItem("tasks",JSON.stringify(tasks));
        renderTasks();
        alert("✅ JSON restauré !");
      }catch(err){alert("❌ Impossible de lire le JSON");}
    };
    reader.readAsText(file);
  });
});

// --- Prompts ---
const prompts=[
  {id:"planifier",label:"Plan",text:"Transforme ces tâches en plan structuré étape par étape :"},
  {id:"prioriser",label:"Priorité",text:"Classe ces tâches par ordre de priorité et urgence :"},
  {id:"categoriser",label:"Catégories",text:"Range ces tâches dans des catégories logiques :"}
];

prompts.forEach(p=>{
  const btn=document.createElement("button");
  btn.textContent=p.label;
  btn.addEventListener("click",()=>{
    const combined=p.text+"\n\n"+tasks.map(t=>{
      let str="- "+t.text;
      if(t.comments?.length) str+="\n  Commentaires :\n"+t.comments.map(c=>`    - [${formatDate(c.date)}] ${c.text}`).join("\n");
      return str;
    }).join("\n");
    navigator.clipboard.writeText(combined).then(()=>{
      copiedMsg.style.display="block";
      setTimeout(()=>copiedMsg.style.display="none",2000);
      window.open(llmSelect.value,"_blank");
    });
  });
  promptsContainer.appendChild(btn);
});

// --- Push JSON vers modules ---
pushJsonBtn.addEventListener("click",()=>{
  try{
    const data=JSON.parse(jsonPaste.value);
    llmData=data; // stocké pour modules
    populateModules();
  }catch(err){alert("❌ JSON invalide !");}
});

// --- Populate Modules ---
function populateModules(){
  if(!llmData) return;

  // Jalons
  jalonsList.innerHTML="";
  if(llmData.jalons?.length){
    llmData.jalons.forEach(j=>{
      const li=document.createElement("li");
      li.innerHTML=`<strong>${j.titre}</strong> (Prévue: ${j.datePrévue || ''})<ul>${j.sousActions?.map(sa=>`<li><input type="checkbox"> ${sa.texte} (${sa.statut})</li>`).join('')}</ul>`;
      jalonsList.appendChild(li);
    });
  }

  // Messages
  messagesTableBody.innerHTML="";
  if(llmData.messages?.length){
    llmData.messages.forEach((m,i)=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td><input type="checkbox"></td><td>${m.destinataire}</td><td>${m.sujet}</td><td>${m.texte}</td><td><input type="text" placeholder="Note…"></td>`;
      messagesTableBody.appendChild(tr);
    });
  }

  // Livrables
  livrablesList.innerHTML="";
  if(llmData.livrables?.length){
    llmData.livrables.forEach((l,i)=>{
      const li=document.createElement("li");
      li.innerHTML=`<input type="checkbox"> ${l.titre} (${l.type}) <input type="text" placeholder="Note…">`;
      livrablesList.appendChild(li);
    });
  }
}

// --- Generate LLM from modules ---
generateMailBtn.addEventListener("click",()=>{
  const selected=[];
  messagesTableBody.querySelectorAll("tr").forEach(tr=>{
    const checkbox=tr.querySelector("input[type='checkbox']");
    const note=tr.querySelector("input[type='text']").value;
    if(checkbox.checked) selected.push({...llmData.messages[Array.from(messagesTableBody.rows).indexOf(tr)],note});
  });
  if(selected.length){
    const text=JSON.stringify(selected,null,2);
    navigator.clipboard.writeText(text).then(()=>window.open(llmSelect.value,"_blank"));
  }
});

generateLivrableBtn.addEventListener("click",()=>{
  const selected=[];
  livrablesList.querySelectorAll("li").forEach((li,i)=>{
    const checkbox=li.querySelector("input[type='checkbox']");
    const note=li.querySelector("input[type='text']").value;
    if(checkbox.checked) selected.push({...llmData.livrables[i],note});
  });
  if(selected.length){
    const text=JSON.stringify(selected,null,2);
    navigator.clipboard.writeText(text).then(()=>window.open(llmSelect.value,"_blank"));
  }
});

// --- Initial render ---
renderTasks();
