import Chart from 'chart.js/auto';

let data = null;
let problems = null;
let solvers = null;

function getDatabase(){
    const req = new XMLHttpRequest();
    req.addEventListener("load", evt => {
        data = JSON.parse(req.responseText)[2].data;
        problems = {};
        solvers = {};
        for(let row of data){
            if(!problems.hasOwnProperty(row.family)){
                problems[row.family] = {};
                problems[row.family][row.benchmark_id] = row.fullname;
            } else if(!problems[row.family].hasOwnProperty(row.benchmark_id)){
                problems[row.family][row.benchmark_id] = row.fullname;
            }
            if(!solvers.hasOwnProperty(row.id_solver)){
                solvers[row.solver_id] = row.name;
            };
        }
        document.dispatchEvent(new CustomEvent("database-loaded"));
    });
    req.open("GET", "https://www.cril.univ-artois.fr/~lecoutre/teaching/jssae/code5/results.json");
    req.send(); 
}

function getExecutionTime(problem, solver){
    for(let row of data){
        if(row.fullname == problem && row.name == solver){
            return {
                time: row.time,
                vars: row.nb_variables
            };
        }
    }
    return false;
}

function compareExecutionTime(problem,ctx){
    ctx.parentElement.querySelector(".error").classList.add("hidden");
    if(Chart.getChart(ctx)!=undefined){
        Chart.getChart(ctx).destroy();
    }
    let satisfiedSolvers = [];
    for(let [id,name] of Object.entries(solvers)){
        for(let row of data){
            if(row.fullname == problem && row.status == "SAT" && row.solver_id == id){
                satisfiedSolvers.push(name);
            }
        }
    }
    if(satisfiedSolvers.length == 0){
        ctx.parentElement.querySelector(".error").classList.remove("hidden");
    } else {
        return new Chart(ctx, {
            type: 'bar',
            data: {
            labels: satisfiedSolvers,
            datasets: [{
                label: "Execution time (seconds)",
                data: satisfiedSolvers.map(v=>getExecutionTime(problem,v).time),
                borderWidth: 1,
                backgroundColor: "#99ff99"
            }]
            },
            options: {
                maintainAspectRatio: false,
                scales:{
                    x:{
                        ticks:{
                            color: "white"
                        },
                        barPercentage: 0.1,
                    },
                    y:{
                        ticks:{
                            color: "white"
                        },
                        beginAtZero: true,
                    }
                },
                plugins: {
                    legend: {
                        labels :{
                            color: "white"
                        }
                    }
                }
            }
        })
    };
}

function getAllExecutionTimes(problemFamily, solver){
    let executionTimes = [];
    for(let [family,familyProblems] of Object.entries(problems)){
        if(family == problemFamily){
            for(let familyProblem of Object.values(familyProblems)){
                executionTimes.push(getExecutionTime(familyProblem,solver));
            }
        }
    }
    if(Chart.getChart(document.getElementById("execution-time-line-chart"))){
        Chart.getChart(document.getElementById("execution-time-line-chart")).destroy();
    }   
    new Chart(document.getElementById("execution-time-line-chart"),{
        type: "line",
        data: {
            labels: executionTimes.map(v=>v.vars),
            datasets : [{
                label: "Execution time",
                data : executionTimes.map(v=>v.time),
                fill: false,
                borderColor: '#99ff99',
            }]
        },
        options:{
            plugins:{
                legend:{
                    labels:{
                        color: "white"
                    }
                }
            },
            scales:{
                x:{
                    ticks:{
                        color: "white"
                    },
                    title:{
                        display: true,
                        text: "Variables",
                        color: "white"
                    }
                },
                y:{
                    ticks:{
                        color: "white"
                    },
                    title:{
                        display: true,
                        text: "Execution time",
                        color: "white"
                    }
                }
            }
        }
    });
    document.getElementById("execution-times-chart").querySelector(".resolver-select .current-value").innerText = solver;
    let available_values = document.getElementById("execution-times-chart").querySelectorAll(".available-values div");
    for(let available_value of available_values){
        available_value.onclick = ()=>{
            executionTimesChart(problemFamily, available_value.innerText);
        }
    }
}

function executionTimesChart(problemFamily,solver){
    document.getElementById("execution-times-chart").classList.remove("hidden");
    getAllExecutionTimes(problemFamily,solver);
}

function addMenuRow(first_element, menu, events = null){
    let menu_row = document.createElement("div");
    menu_row.classList.add("menu_container_row");
    menu_row.appendChild(first_element);
    menu_row.innerHTML += "<i class='bx bx-right-arrow'></i>";
    if(events!=null){
        for(let event of events){
            menu_row.addEventListener(event.type, event.action);
        }
    }
    menu.appendChild(menu_row);
}

function createMenu(elements, events = null){
    window.scrollTo(0,0);
    let menu = document.querySelector("#template-menu .menu_container");
    menu.innerHTML = "";
    menu.parentElement.classList.remove("hidden");
    let firstRow = document.createElement("div");
    firstRow.classList.add("menu_container_row");
    firstRow.onclick = ()=>{
        firstRow.closest(".menu").classList.add("hidden");
    }
    firstRow.innerHTML = "<div><i class='bx bx-arrow-back'></i></div>";
    menu.appendChild(firstRow);
    
    for(let element of elements){
        addMenuRow(element,menu, events);
    }
    return menu;
}

function resolverCharts(solver_id){
    document.getElementById("resolver-charts").classList.remove("hidden");
    document.querySelector("#resolver-charts .first-resolver").innerText = solvers[solver_id];
    document.querySelector("#resolver-charts .second-resolver").innerText = solvers[solver_id];
    document.querySelector("#resolver-charts .selected-problem").innerText = Object.values(Object.values(problems)[0])[0];
    let results = {};
    for(let row of data){
        if(row.solver_id == solver_id){
            if(!results.hasOwnProperty(row.status)){
                results[row.status] = 1;
            } else {
                results[row.status] ++;
            }
        }
    }
    results = Object.entries(results);
    if(Chart.getChart(document.getElementById("resolver-pie-chart"))!=undefined){
        Chart.getChart(document.getElementById("resolver-pie-chart")).destroy();
    }
    new Chart(document.getElementById("resolver-pie-chart"),
    {
        type: "pie",
        data: {
            labels: results.map(v=>v[0]),
            datasets: [{
                label: "Status",
                data: results.map(v=>v[1]),
                backgroundColor: ["#99ff99","#e4ff99","#c2f8c2","#d3ff58"],
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: "bottom",
                    labels : {
                        color: "white"
                    }
                },
                title: {
                    display: true,
                    text: solvers[solver_id] + " global answers"
                }
            },
        }
    })
}

function getProblemFamily(problem){
    for(let [family,familyProblems] of Object.entries(problems)){
        if(Object.values(familyProblems).includes(problem)){
            return family;
        }
    }
}

function problemChart(problem){
    let canvas = document.getElementById("problem-bar-chart");
    document.getElementById("problem-chart").classList.remove("hidden");
    let chart = compareExecutionTime(problem,canvas);
    canvas.onclick = (evt) => {
        const res = chart.getElementsAtEventForMode(
          evt,
          'nearest',
          { intersect: true },
          true
        );
        if(res.length === 0) {
            return;
        } else {
            executionTimesChart(getProblemFamily(problem),chart.data.labels[res[0].index]);
        }
       
    };
}
function compareResolvers(first_resolver, second_resolver, problem){
    document.getElementById("resolver-compare").classList.remove("hidden");
    document.getElementById("resolver-compare").querySelector(".first-resolver").innerText = first_resolver;
    document.getElementById("resolver-compare").querySelector(".second-resolver").innerText = second_resolver;
    document.getElementById("resolver-compare").querySelector(".selected-problem").innerText = problem;
    document.getElementById("resolver-compare").querySelector(".error").classList.add("hidden");
    if(Chart.getChart(document.getElementById("resolver-compare-scatter-chart"))!=undefined){
        Chart.getChart(document.getElementById("resolver-compare-scatter-chart")).destroy();
    }
    if(getExecutionTime(problem,first_resolver).time == "0.00" && getExecutionTime(problem,second_resolver).time == "0.00"){
        document.getElementById("resolver-compare").querySelector(".error").classList.remove("hidden");
    } else {
        let chart = new Chart(document.getElementById("resolver-compare-scatter-chart"),{
            type: "bar",
            data: {
                labels: [first_resolver, second_resolver],
                datasets: [{
                    label: "Execution time (seconds)",
                    data: [getExecutionTime(problem,first_resolver).time, getExecutionTime(problem,second_resolver).time],
                    backgroundColor: "#99ff99",
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                    beginAtZero: true
                    }
                },
                plugins: {
                    legend : {
                        labels : {
                            color: "white"
                        }
                    }
                }
            }
        });
        let canvas = document.getElementById("resolver-compare-scatter-chart");
        canvas.onclick = (evt) => {
            const res = chart.getElementsAtEventForMode(
              evt,
              'nearest',
              { intersect: true },
              true
            );
            if(res.length === 0) {
                return;
            } else {
                executionTimesChart(getProblemFamily(problem),chart.data.labels[res[0].index]);
            }
           
        };
    }
}
document.addEventListener("database-loaded",()=>{
    let lastClickedMenus= [];

    document.getElementById("resolvers").addEventListener("click",()=>{
        let elements = [];
        for(let [id,name] of Object.entries(solvers)){
            let element = document.createElement("div");
            element.innerHTML = "<span class='id'>" + id + "</span><span class='name'>" + name + "</span>";
            elements.push(element);
        }
        createMenu(elements,[{
            type: "click",
            action : (event)=>{
                resolverCharts(event.target.querySelector(".id").innerText)
            }
        }]);
    });

    document.getElementById("problems").addEventListener("click",()=>{
        let elements = [];
        for(let [family,problemsList] of Object.entries(problems)){
            let element = document.createElement("div");
            element.innerHTML = "<span class='name'>" + family + "</span>";
            elements.push(element);
        }
        createMenu(elements,[{
            type:"click",
            action: (event)=>{
                let elements = [];
                for(let [id,name] of Object.entries(problems[event.target.querySelector(".name").innerText])){
                    let element = document.createElement("div");
                    element.innerHTML = "<span class='id'>" + id + "</span><span class='name'>" + name + "</span>";
                    elements.push(element);
                }
                createMenu(elements, [{
                    type: "click",
                    action: (event)=>{
                        problemChart(event.target.querySelector('.name').innerText);
                    }

                }]);
            }
            
        }]);
    });

    let resolver_selects = document.querySelectorAll(".resolver-select");
    for(let resolver_select of resolver_selects){
        for(let [id,name] of Object.entries(solvers)){
            resolver_select.querySelector(".available-values").innerHTML += "<div>" + name + "</div>";
        }
        resolver_select.addEventListener("mouseenter",()=>{
            resolver_select.classList.add("active");
        });
        resolver_select.addEventListener("mouseleave",()=>{
            resolver_select.classList.remove("active");
        })
    }
    let problem_selects = document.querySelectorAll(".problem-select");
    for(let problem_select of problem_selects){
        for(let [family,familyProblems] of Object.entries(problems)){
            for(let problem of Object.values(familyProblems)){
                problem_select.querySelector(".available-values").innerHTML += "<div>" + problem + "</div>";
            }
        }
        problem_select.addEventListener("mouseenter",()=>{
            problem_select.classList.add("active");
        });
        problem_select.addEventListener("mouseleave",()=>{
            problem_select.classList.remove("active");
        })
    }
    let available_values = document.querySelectorAll(".available-values > div");
    for(let available_value of available_values){
        available_value.onclick = ()=>{
            available_value.parentElement.previousElementSibling.innerText = available_value.innerText;
            available_value.parentElement.parentElement.classList.remove("active");
        }
    }
    let checkButtons = document.querySelectorAll(".check");
    for(let checkButton of checkButtons){
        checkButton.onclick = ()=>{
            compareResolvers(checkButton.parentElement.querySelector(".first-resolver").innerText, checkButton.parentElement.querySelector(".second-resolver").innerText, checkButton.parentElement.querySelector(".selected-problem").innerText);
        }
    }
    let backButtons = document.querySelectorAll(".back");
    for(let backButton of backButtons){
        backButton.onclick = ()=>{
            backButton.parentElement.classList.add("hidden");
        }
    }
});

getDatabase();


