// === Stack 1 : tâches & commentaires ===
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksContainer = document.getElementById("tasksContainer");
const clearBtn = document.getElementById("clearBtn");
const archiveBtn = document.getElementById("archiveBtn");
const generateJSONBtn = document.getElementById("generateJSONBtn");
const llmSelect = document.getElementById("llmSelect");
const jsonPaste = document.getElementById("jsonPaste");
const pushJSONBtn = document.getElementById("pushJSONBtn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function formatDate(iso){ const d = new Date(iso); return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`; }

function renderTasks(){
  tasksContainer.innerHTML="";
  tasks.forEach((task,i)=>{
    const li = document.createElement("li");
    const taskDiv = document.createElement("div");
    taskDiv.textContent = task.text;
    taskDiv.style.cursor="pointer";

    const commentBlock = document.createElement("div");
    commentBlock.className="comment-section";
    commentBlock.style.display="none";

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

    taskDiv.addEventListener("click", ()=>{
      commentBlock.style.display = "flex";
    });

    li.appendChild(taskDiv); li.appendChild(commentBlock);
    tasksContainer.appendChild(li);
  });
}

addBtn.addEventListener("click", ()=>{
  const text = taskInput.value.trim();
  if(text!==""){ tasks.push({text,date:new Date().toISOString(),comments:[]}); localStorage.setItem("tasks",JSON.stringify(tasks)); taskInput.value=""; renderTasks(); }
});

clearBtn.addEventListener("click", ()=>{
  if(confirm("Es-tu sûr ? Cette action est irréversible !")){ tasks=[]; localStorage.removeItem("tasks"); renderTasks(); alert("✅ Toutes les tâches ont été supprimées."); }
});

archiveBtn.addEventListener("click", ()=>{
  if(tasks.length===0){ alert("Aucune tâche à archiver !"); return; }
  const blob = new Blob([JSON.stringify(tasks,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url;
  a.download=`taches_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
});

// === Générer JSON + prompt ===
generateJSONBtn.addEventListener("click", ()=>{
  if(tasks.length===0){ alert("Aucune tâche à envoyer !"); return; }
  const prompt=`Tu es un assistant de gestion de projet. Transforme les tâches + commentaires en JSON structuré prêt à l'emploi.`;
  const tasksText = tasks.map(t=>`- ${t.text}${t.comments?.length? "\n  Commentaires:\n" + t.comments.map(c=>`    - [${c.date}] ${c.text}`).join("\n"):""}`).join("\n");
  const finalText = prompt + "\n\n" + tasksText;
  navigator.clipboard.writeText(finalText).then(()=>{ alert("Prompt + tâches copiés !"); window.open(llmSelect.value,"_blank"); });
});

// === Push JSON vers modules ===
pushJSONBtn.addEventListener("click", ()=>{
  try{
    const data = JSON.parse(jsonPaste.value);
    populateModules(data);
    alert("✅ JSON injecté dans les modules !");
  }catch(err){ console.error(err); alert("❌ JSON invalide !"); }
});

// === Stack 2 : modules ===
const jalonsList = document.getElementById("jalonsList");
const messagesList = document.getElementById("messagesList");
const livrablesList = document.getElementById("livrablesList");
const messagesPromptSelect = document.getElementById("messagesPromptSelect");
const sendMessagesBtn = document.getElementById("sendMessagesBtn");
const livrablesPromptSelect = document.getElementById("livrablesPromptSelect");
const sendLivrablesBtn = document.getElementById("sendLivrablesBtn");

function populateModules(data){
  // Jalons
  jalonsList.innerHTML="";
  if(data.jalons) data.jalons.forEach(j=>{
    const li=document.createElement("li"); li.textContent=j.titre; jalonsList.appendChild(li);
  });
  // Messages
  messagesList.innerHTML="";
  if(data.messages) data.messages.forEach((m,i)=>{
    const li=document.createElement("li");
    const checkbox=document.createElement("input"); checkbox.type="checkbox";
    const noteInput=document.createElement("input"); noteInput.placeholder="Notes…";
    li.textContent=`${m.destinataire}: ${m.sujet}`;
    li.appendChild(checkbox); li.appendChild(noteInput);
    messagesList.appendChild(li);
  });
  // Livrables
  livrablesList.innerHTML="";
  if(data.livrables) data.livrables.forEach(l=>{
    const li=document.createElement("li");
    const checkbox=document.createElement("input"); checkbox.type="checkbox";
    const noteInput=document.createElement("input"); noteInput.placeholder="Notes…";
    li.textContent=`${l.titre} (${l.type})`; li.appendChild(checkbox); li.appendChild(noteInput);
    livrablesList.appendChild(li);
  });
}

// Envoyer Messages au LLM
sendMessagesBtn.addEventListener("click", ()=>{
  const selected=[];
  Array.from(messagesList.children).forEach(li=>{
    const checkbox=li.querySelector('input[type="checkbox"]');
    const note=li.querySelector('input[type="text"]');
    if(checkbox.checked) selected.push(`${li.textContent} Notes: ${note.value}`);
  });
  if(selected.length===0){ alert("Sélectionnez au moins un message !"); return; }
  const prompt=`Prompt Messages: ${messagesPromptSelect.value}\n\n${selected.join("\n")}`;
  navigator.clipboard.writeText(prompt).then(()=>{ window.open(llmSelect.value,"_blank"); alert("Messages copiés pour le LLM !"); });
});

// Envoyer Livrables au LLM
sendLivrablesBtn.addEventListener("click", ()=>{
  const selected=[];
  Array.from(livrablesList.children).forEach(li=>{
    const checkbox=li.querySelector('input[type="checkbox"]');
    const note=li.querySelector('input[type="text"]');
    if(checkbox.checked) selected.push(`${li.textContent} Notes: ${note.value}`);
  });
  if(selected.length===0){ alert("Sélectionnez au moins un livrable !"); return; }
  const prompt=`Prompt Livrables: ${livrablesPromptSelect.value}\n\n${selected.join("\n")}`;
  navigator.clipboard.writeText(prompt).then(()=>{ window.open(llmSelect.value,"_blank"); alert("Livrables copiés pour le LLM !"); });
}

// Initial render
renderTasks();
