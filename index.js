let todoForm=document.querySelector('form');
let todoInput=document.getElementById('todo_input');
let todoList=document.getElementById('todo_list');


let allTodos=loadTodo()
updateTodoList( )
todoForm.addEventListener('submit',(e)=>{
e.preventDefault();
addTodo();
todoInput.value='';
console.log('submitted');
})


function addTodo(){
    let todoText=todoInput.value.trim();
    
    if(todoText.length>0){
        const todoObject={
            text:todoText,
            completed:false
        }
        allTodos.push(todoObject)
        console.log(todoText)
        updateTodoList(todoText)
        saveTodo()
        todoInput.value=''
    }
    
}

function updateTodoList(){
    todoList.innerHTML=''
        allTodos.forEach((todo,todoIndex)=>{
            let todoitem=createTodoitem(todo,todoIndex);
            console.log(todoitem)
            todoList.append(todoitem)
        })  
}

function createTodoitem(text,todoIndex){
    let todoLI=document.createElement('li')
    let textfromobj=text.text
    todoLI.classList='todo'
    let todoid="todo-"+todoIndex;
    todoLI.innerHTML=`
          <input type="checkbox" name="" id=${todoid} />
          <label class="custom_checkbox" for="${todoid}">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="transparent"
            >
              <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
            </svg>
          </label>
          <label for="${todoid}" class="todo_text">
            ${textfromobj}
          </label>
          <button class="delete_btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="var(--secondary)"
            >
              <path
                d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
              />
            </svg>
          </button>
    `
    const checkbox=todoLI.querySelector('input')
    checkbox.addEventListener('change',()=>{
        allTodos[todoIndex].completed=checkbox.checked
        saveTodo()
    })
    const deletbtn=todoLI.querySelector('.delete_btn')
    deletbtn.addEventListener('click',()=>{
        deleteTodo(todoIndex)
    })
    console.log(todoLI.value);
    checkbox.checked=text.completed
    return todoLI ;
}

function saveTodo(){
    const todos=JSON.stringify(allTodos)
localStorage.setItem("todos",todos)
}


function loadTodo(){
    const todos=localStorage.getItem('todos') || "[]"
    return JSON.parse(todos)
}

function deleteTodo(todoIndex){
    allTodos=allTodos.filter((_,i)=> i!==todoIndex)
    saveTodo()
    updateTodoList()
}