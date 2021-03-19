let data, positions;
let crewList = [];
let VCM=0, numberOfSectors=1
let outOfGrade = {}, positionsObject = {position1: ""};
let hasBreaks = false;

function generate () { //main function
    loadBreakes();
    loadNumberOfSectors();
    loadCrew();
    if (aircraftType.includes("cargo")){
        loadPositionsCargo(aircraftType);
        selectPositionsCargo();
    }
    else {
        loadPositions(aircraftType);
        checkOutOfGrade();
        selectIR();
        for (let s=1; s<=numberOfSectors; s++){
            selectPositions(s);
        }//end for
    }//end else
    createOutput();
}

function loadCrew (){
    //Parse text data
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    crewList = [];//Clear crew list
    let crew= [];//To temporarly hold HTML collection
    crew = doc.getElementsByClassName('crew-card')
    let counter=1; //counld not get id of items in HTMLcollection properly, so added this counter for simple sorting later

    //Iterate through HTML collection to generate array of objects with crew details
    for (let n of crew){
        const nickname = n.getElementsByClassName('nickname')[0].innerHTML
        const staffNumber = n.getElementsByClassName('id')[0].innerHTML.slice(1)
        const fullname = n.getElementsByClassName('fullname')[0].innerHTML
        const grade = n.getElementsByClassName('grade')[0].innerHTML
        const content = n.getElementsByClassName('crew-content')[0].innerHTML
        const badges = n.getElementsByClassName('badges')[0].innerHTML
        const flag = content.substring(
            content.indexOf(`<img src="https://emiratesgroup.sharepoint.com/sites/ccp/Shared Documents/ACI/country/`) +10,
            content.indexOf(`.png" alt="" data-themekey="#">  </p>      <p class="break"><b>Languages:</b>`)+4
        ) 
        const nationality =content.substring(
            content.indexOf("ality:</b>")+10,
            content.indexOf(`&nbsp;`)
            )
            .replace("Korea, Republic Of", "Korea")//Replace few oficial countries names for easy reading
            .replace("Czech Republic", "Czech")
            .replace("Taiwan, Province Of China", "Taiwan")
            .replace("United Arab Emirates", "UAE")
            .replace("Russian Federation", "Russia")
            .trim();
        const languages = content.substring(
            content.indexOf("Languages:</b> ") + 15,
            content.indexOf(`</p>      <p><b>CCM:`)
            )
            .replace("Ukranian", "Ukrainian");//Grammar correction
        let timeInGrade;
        if (content.includes("Years") === -1) {//Case when crew worked 2 years or more in current grade
            timeInGrade = content.substring(
                content.indexOf("<b>Grade Exp: </b>") + 18,
                content.indexOf("Year")-1
                ) + "y " + content.substring(
                content.indexOf("Year") + 6,
                content.indexOf("Month")-1
                ) + "m";
        } else { // Case when crew worked 1 year in current grade
            timeInGrade = content.substring(
                content.indexOf("<b>Grade Exp: </b>") + 18,
                content.indexOf("Year")-1
                ) + "y " + content.substring(
                content.indexOf("Year") + 5,
                content.indexOf("Month")-1 
                ) + "m";
        }//end else
        let y = parseInt(timeInGrade.substring(0, timeInGrade.indexOf("y")));
        let m = parseInt(timeInGrade.substring(timeInGrade.indexOf("y")+1, timeInGrade.indexOf("m")));
        let timeInGradeNumber = m+y*12;//This required for sorting later to avoid conversion of grade experience
        let ratingIR = 21; //Since maximum rating is 20, this set to 21 so crew can be sorted by inflight retail rating
        if (badges.includes("EMIRATESRED TOP SELLER")) {
            ratingIR = parseInt(badges.substring(badges.indexOf('SELLER'), badges.indexOf("SELLER")+9 ).slice(-2));
        }
        let pcr = false; //Requirement for PCR test results. March 2021 update
        if (badges.includes("NEGATIVE PCR IS REQUIRED")) {
            pcr = true;
        }
        let comment = "";
        if (n.getElementsByClassName("comment").length >= 1) {
            comment = n.getElementsByClassName("comment")[0].innerHTML;
        }
        let count;
        switch (grade){//for purpose of sorting and grade segregation on output
            case "PUR":
                count = counter;
            break;
            case "CSV":
                count = 100+counter;
            break;
            case "FG1":
                count = 200+counter;
            break;
            case "GR1":
                count = 300+counter;
            break;
            case "GR2":
                count = 400+counter;
            break;       
            case "CSA":
                count = 500+counter;
            break;
        }
        let lastPosition;
        if (grade === "PUR" || grade === "CSA" ){//previous position length=0 so any position can be repeated
            lastPosition = []}
        else if (grade === "GR1" || grade === "FG1" || grade === "CSV"){//one previous position shoul not be repeated
            lastPosition = [""]}
        else { //for Gr2 two previous positions should not be repeated
            lastPosition = ["", ""]
        }
        crewList.push({
            count,
            grade,
            nickname,
            fullname,
            nationality,
            flag,
            ratingIR,
            comment,
            staffNumber,
            languages,
            timeInGrade,
            timeInGradeNumber,
            lastPosition,
            inflightRetail: false,
            pcr,
            ... positionsObject
            }) 
        counter++;
    }//end (for n of crew)
}

const loadPositions = (aType) => {
    positions = { ...eval(aType) };//positions cloned from constants
    //VCM check
    let positionsList = [];
    Object.keys(positions).forEach((grade)=>{//Iterate through each grade and group and push positions to an array 
        Object.keys(positions[grade]).forEach((group)=>{
            positions[grade][group].forEach((item)=>{positionsList.push(item)})
        });//end forEach(group)
    })//end forEach(grade)
    if (crewList.length !== positionsList.length) {
        VCM = positionsList.length-crewList.length;
        console.log(`VCM ${VCM} operation`)
        if (VCM >0){ VCMrules()}
        if (VCM <0){ extraRules()}
    }//end if
}

function checkOutOfGrade (){
    Object.keys(positions).forEach((grade)=>{
        let positionsList = [];
        Object.keys(positions[grade]).forEach((group)=>{
            positions[grade][group].forEach((item)=>{positionsList.push(item)})
        });//End forEach(group)
        const filterCrew = crewList.filter( x => x.grade === grade);
        let u = filterCrew.length - positionsList.length;
        if (u !== 0){outOfGrade[grade] = u}
    })//End forEach(grade)
    if (Object.keys(outOfGrade).length > 0){outOfGradeRules()}
}

function selectIR (){//Sets value true for key inflightRetail
    crewList.sort((a, b) => a.ratingIR - b.ratingIR);
    let x = aircraftType.includes('A380') ? 2 : 1;
    for (let i=0; i<x; i++){
        crewList[i].inflightRetail = true;
    }
}

function selectPositions (s){
    let positionsActive = {...positions}

    //Pre-allocated positions check
    //Removes positions that wre manualy pre-allocated by CPM. This functionality for future extension
    const filterCrew = crewList.filter( x => x[`position${s}`] !== "");
    if (filterCrew.length >0){
        for (const r of filterCrew){
            positionsActive[r.grade].forEach((type)=>{
                if (positionsActive[grade][type].includes(r[`position${s}`])){
                      positionsActive[grade][type].splice(positionsActive[grade][type].indexOf(r[`position${s}`]),1);
                }//end if
            })//end forEach(type)
        }//enf for (const r of filterCrew)
    }//enf if
    //End of pre-allocated positions check

    Object.keys(positionsActive).forEach((grade)=>{
        Object.keys(positionsActive[grade]).forEach((type)=>{
            if (positionsActive[grade][type].length!==0){
                if (type === "galley"){
                    positionsActive[grade][type].forEach((position)=>{
                        let filteredCrew = crewList.filter( x => 
                            x.grade === grade && 
                            x.timeInGradeNumber > 6 && 
                            x[`position${s}`]==="" && 
                            x.inflightRetail !== true); //to not give galley position to IR operator
                        const filteredCrewLast = filteredCrew.filter( p => 
                            p.lastPosition.includes(position) !==true);
                        if (filteredCrewLast.length > 0){filteredCrew = filteredCrewLast};
                        if (filteredCrew.length > 1 && grade === "GR2"){filteredCrew.pop()};//Removes most junior crew - to ensure CSA position given to most junior crew if available
                        let w = filteredCrew.length;
                        let q = getRandomNumber(0, w-1);    
                        filteredCrew[q][`position${s}`] = position; 
                        filteredCrew[q].lastPosition.push(position); 
                        filteredCrew[q].lastPosition.shift(); 
                        })//end forEach(position)
                }
                else {//non-galley positions ("main")
                    positionsActive[grade][type].forEach((position)=>{
                        if (position === "CSA" || position === "R3 (CSA)" || position === "MR3 (CSA)"){
                            const filteredCrew = crewList.filter( x => 
                                x.grade === grade && 
                                x[`position${s}`]==="");
                            filteredCrew.sort((a, b) => a.timeInGradeNumber - b.timeInGradeNumber);
                            filteredCrew[0][`position${s}`] = position;
                            filteredCrew[0].lastPosition.push(position); 
                            filteredCrew[0].lastPosition.shift(); 
                        }//end if
                        else{//non-CSA positions
                            let filteredCrew = crewList.filter( x => 
                                x.grade === grade && 
                                x[`position${s}`]==="" && 
                                x.lastPosition.includes(position) !==true);
                            let w = filteredCrew.length;
                            if (w===0){ //No solution. Ignore last position
                                filteredCrew = crewList.filter( x => 
                                    x.grade === grade && 
                                    x[`position${s}`]==="" );
                                w = filteredCrew.length;
                                      }//end if (w===0)
                            let q = getRandomNumber(0, w-1);
                            filteredCrew[q][`position${s}`] = position; 
                            filteredCrew[q].lastPosition.push(position); 
                            filteredCrew[q].lastPosition.shift(); 
                        }//end else non-CSA
                    })//end forEach(position) 
                }//end else non-galley
            }//end if position type empty
        })//end forEach(type)
    })//end forEach((grade)
}

//Next few functions handle non-standard operation rules
function extraRules(){
    //For rare case, when operating with additional crew. This happens when for example 3 class crew set on return sector operates 2 class aircraft
    for (let f=0; f>VCM; f--){
        positions.GR2.main.push(EXTRA[aircraftType].shift())
    }
}
function VCMrules (){
    //CSA check
    const filteredCrew = crewList.filter( x => x.grade === "CSA");
    let hasCSA = true;
    if (filteredCrew.length === 0){
        positions.CSA.main.pop();
        positions.GR2.main.unshift("CSA")
        hasCSA = false;
    }
    else { //if CSA is present VCM rules need to go additional step (first step is CSA replacement)
        VCM ++;
    }
    //Crew positions adjustment
    switch(aircraftType) {
        //===========================================================================
        case "A380_3class_ULR":
        case "A380_3class_nonULR":
            if (VCM >= 1 && hasCSA === false){ //CSA counted towards total crew compliment
                positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR3"),1);
                positions.GR2.main.unshift("MR3 (CSA)");
            }
            if (VCM >= 2){ //if CSA present, then start fro mthis rule
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML4"),1)
                positions.GR1.main.splice(positions.GR1.main.indexOf("ML4A"),1)
                positions.GR1.main.push("ML4 (ML4A)")
            }
            if (VCM >= 3){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR5"),1)
                positions.GR1.main.splice(positions.GR1.main.indexOf("MR4A"),1)
                positions.GR1.main.push("MR5 (MR4A)")
            }
            if (VCM >= 4){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML3"),1)
                positions.GR1.galley.splice(positions.GR1.main.indexOf("ML3A"),1)
                positions.GR1.galley.push("ML3 (ML3A)")
            }
            if (VCM >= 5 && aircraftType === "A380_3class_ULR"){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("ML1"),1)
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR1"),1)
                positions.PUR.main.push("ML1 (PUR)")
                positions.CSV.main.push("MR1 (ML1)")
            }
            if (VCM >= 5 && aircraftType === "A380_3class_nonULR"){ 
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML1"),1)
                positions.PUR.main.push("ML1 (PUR)")
            }
            if (VCM >= 6){
                console.error("Less than minimum crew requirement to operate")
            }
        break;
        //===========================================================================
        case "A380_2class_ULR":
        case "A380_2class_nonULR":
            if (VCM >= 1 && hasCSA === false){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR3"),1);
                positions.GR2.main.unshift("MR3 (CSA)");
            }
            if (VCM >= 2){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML3"),1)
                positions.GR1.galley.splice(positions.GR1.main.indexOf("ML3A"),1)
                positions.GR1.galley.push("ML3 (ML3A)")
            }
            if (VCM >= 3 && aircraftType === "A380_3class_ULR"){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("ML1"),1)
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR1"),1)
                positions.PUR.main.push("ML1 (PUR)")
                positions.CSV.main.push("MR1 (ML1)")
            }
            if (VCM >= 3 && aircraftType === "A380_3class_nonULR"){ 
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML1"),1)
                positions.PUR.main.push("ML1 (PUR)")
            }
            if (VCM >= 4){
                console.error("Less than minimum crew requirement to operate")
            }
        break;
        //===========================================================================
        case "B773_2class":
            if (VCM >= 1 && hasCSA === false){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R3"),1);
                positions.GR2.main.unshift("R3 (CSA)");
            }
            if (VCM >= 2){ 
                positions.GR2.galley.splice(positions.GR2.main.indexOf("L5A"),1);
            }
            if (VCM >= 3){ 
                positions.GR1.galley.splice(positions.GR1.main.indexOf("L1A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R2"),1);
                positions.GR1.galley.push("R2 (L1A)");
            }
            if (VCM >= 4){ 
                positions.GR1.main.splice(positions.GR1.main.indexOf("L1"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("L2"),1);
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1);
                positions.GR1.main.push("L2 (L1)");
                positions.PUR.main.push("L1 (PUR)");
            }
            if (VCM >= 5){
                console.error("Less than minimum crew requirement to operate")
            }
        break;
        //===========================================================================
        case "B773_3class":
            if (VCM >= 1 && hasCSA === false){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R3"),1);
                positions.GR2.main.unshift("R3 (CSA)");
            }
            if (VCM >= 2){ 
                positions.GR2.galley.splice(positions.GR2.main.indexOf("L5A"),1);
            }
            if (VCM >= 3){ 
                positions.GR1.galley.splice(positions.GR1.main.indexOf("L2A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("L4"),1);
                positions.GR1.galley.push("L4 (L2A)");
            }
            if (VCM >= 4){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("R2A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R4"),1);
                positions.CSV.main.push("R4 (R2A)");
            }
            if (VCM >= 5){ 
                positions.FG1.main.splice(positions.FG1.main.indexOf("L1"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R5"),1);
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1);
                positions.FG1.main.push("R5 (L1)");
                positions.PUR.main.push("L1 (PUR)");
            }
            if (VCM >= 6){
                console.error("Less than minimum crew requirement to operate")
            }
        break;
        //===========================================================================
        case "B772":
            if (VCM >= 1 && hasCSA === false){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R3"),1);
                positions.GR2.main.unshift("R3 (CSA)");
            }
            if (VCM >= 2){ 
                positions.GR2.main.splice(positions.GR2.main.sindexOf("L4A"),1);
            }
            if (VCM >= 3){ 
                positions.GR1.main.splice(positions.GR1.main.indexOf("R1A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R2"),1);
                positions.GR1.main.push("R2 (R1A)");
            }
            if (VCM >= 4){ 
                positions.GR1.galley.splice(positions.GR1.main.indexOf("L1A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("L2"),1);
                positions.GR1.galley.push("L2 (L1A)");
            }
            if (VCM >= 5){ 
                positions.GR1.main.splice(positions.GR1.main.indexOf("L1"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R4"),1);
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1);
                positions.GR1.main.push("R4 (L1)");
                positions.PUR.main.push("L1 (PUR)");
            }
            if (VCM >= 6){
              console.error("Less than minimum crew requirement to operate")
            }
        break;
        default:
            console.error("Aircraft type not found!")
    }//end switch
}

const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function outOfGradeRules (){
    const grades = {"PUR": 5, "CSV":4, "FG1": 3, "GR1":2,"GR2": 1, "CSA":0}; //Used to manipulate grades as numbers. Since crew can operate only 1 grade higher or 2 grades lower
    do{
        let oldGrade = Object.keys(outOfGrade).find(key => outOfGrade[key] > 0);
        let newGrade = Object.keys(outOfGrade).find(key => outOfGrade[key] < 0);
        if (grades[oldGrade] - grades[newGrade] <= 2 
            && grades[oldGrade] - grades[newGrade] > 0){ // Crew pulled as lower grade
            const filterCrew = crewList.filter( x => x.grade === oldGrade);
            filterCrew.sort((a, b) => a.timeInGradeNumber - b.timeInGradeNumber); //most junior crew
            filterCrew[0].grade= newGrade; //moves crew to a new grade
            filterCrew[0].originalGrade= oldGrade; 
            filterCrew[0].count = filterCrew[0].count + (grades[oldGrade] - grades[newGrade])*100;
        }
        else if (grades[oldGrade] - grades[newGrade] >= -1 
            && grades[oldGrade] - grades[newGrade] < 0){ // Crew pulled as higher grade
            const filterCrew = crewList.filter( x => x.grade === oldGrade);
            filterCrew.sort((a, b) => b.timeInGradeNumber - a.timeInGradeNumber); //most senior crew
            filterCrew[0].grade= newGrade; 
            filterCrew[0].originalGrade= oldGrade; 
            filterCrew[0].timeInGradeNumber = 0; 
            filterCrew[0].count = filterCrew[0].count - (grades[newGrade] - grades[oldGrade])*100;
        }
        else {//crew pulled out with big grade gap. Only happens to pull as much lower grade
            let middleGrade = Object.keys(grades).find(key => grades[key] === grades[oldGrade] - 2);
            //first crew
            const filterCrew = crewList.filter( x => x.grade === oldGrade);
            filterCrew.sort((a, b) => a.timeInGradeNumber - b.timeInGradeNumber);
            filterCrew[0].grade= middleGrade; 
            filterCrew[0].originalGrade= oldGrade; 
            filterCrew[0].count = filterCrew[0].count + (grades[oldGrade] - grades[middleGrade])*100;
            //second crew
            const filterMiddleCrew = crewList.filter( x => x.grade === middleGrade);
            filterMiddleCrew.sort((a, b) => a.timeInGradeNumber - b.timeInGradeNumber);
            filterMiddleCrew[0].grade= newGrade; 
            filterMiddleCrew[0].originalGrade= middleGrade; 
            filterMiddleCrew[0].count = filterMiddleCrew[0].count + (grades[middleGrade] - grades[newGrade])*100;
        }
        //Need to add rare condition, when high grade missing and low grade pulled out
        //For example, need Fg1 and pulled Gr2 so all grades need to move up 1 person till filled
        outOfGrade[oldGrade] --;
        outOfGrade[newGrade] ++;
    } while (Object.values(outOfGrade).reduce((a, b) => a + Math.abs(b)) !== 0)
}

//Position handlers for cargo flights simplified since crew work out of grades, no galleys and inflight retail
function selectPositionsCargo () {
    positions.forEach((h, index) => {
        crewList[index].position1=h
    })
}
function loadPositionsCargo (aType){
    positions = [ ...eval(aType) ]
}

//Renderer draws tablet with crew details and allocated positions
function createOutput () {
    crewList.sort((a, b) => a.count - b.count);
    let headerInsert = ""; //Variable number of sectors and breaks
    for (const s of Object.keys(positionsObject)){
        headerInsert+=`<th>${s}</th>`
    }
    const header = `
        <table border="1">  
            <tr>
                <th>Grade</th>
                <th>Nickname</th>
                <th>PCR</th>
                ${headerInsert}
                <th>Full name</th>
                <th>Staff number</th>
                <th>Nationality</th>
                <th>Languages</th>
                <th>Time in grade</th>
                <th>Rating DF</th>
                <th>Comment</th>
            </tr>`;
    const footer = `</table>`;
    let fileContent = "";
    let lastGrade = ""; 
    crewList.forEach(createTable); 
        function createTable(item, index) {
            if (lastGrade == "") {
                // item.grade = "PUR"; // добавляет мне праивльный грейд
                // Create separation lines in tablet between cabins. Decoration for better visuals
                fileContent += `
                    <tr><td class="centerCell"colspan="30" style="background-color:#F7DC6F">
                        <b>Seniors</b>
                    </td></tr>`;
            }
            if (lastGrade !== item.grade && item.grade == "GR1") {
                fileContent += `
                    <tr class="CSA"><td class="centerCell" colspan="30" style="background-color:#5DADE2">
                        <b>Business class</b>
                    </td></tr>`;
            }
            if (lastGrade !== item.grade && item.grade == "FG1") {
                fileContent += `
                    <tr><td class="centerCell" colspan="30" style="background-color:#EC7063">
                        <b>First class</b>
                    </td></tr>`;
            }
            if (lastGrade !== item.grade && item.grade == "GR2") {
                fileContent += `
                    <tr><td class="centerCell" colspan="30" style="background-color:#52BE80">
                        <b>Economy class</b>
                    </td></tr>`;
            }
            let fileContentInsert = "";
            for (let s=1; s<=numberOfSectors; s++){
                fileContentInsert+=`<td><div contenteditable>${item["position"+s]}</div></td>`;
                    if (hasBreaks){
                        fileContentInsert+=`<td><div contenteditable>${item["break"+s]}</div></td>`;
                    }//end if
            }//end for
            fileContent += `<tr><td class="centerCell">${item.grade} ${item.originalGrade?"("+item.originalGrade+")":""}</td><td>${item.nickname}</td><td>${item.pcr?'<div class="pcr">PCR</div>':''}</td>${fileContentInsert}<td>${item.fullname}</td><td class="centerCell">${item.staffNumber}</td><td>${item.nationality}</td><td>${item.languages}</td><td class="centerCell">${item.timeInGrade}</td><td class="centerCell">${item.ratingIR<=20?item.ratingIR:""}</td><td>${item.comment}</td></tr>`;
            //With flags
            // fileContent += `<tr><td class="centerCell">${item.grade}</td><td>${item.nickname}</td><td>${item.pcr?'<div class="pcr">PCR</div>':''}</td>${fileContentInsert}<td>${item.fullname}</td><td class="centerCell">${item.staffNumber}</td><td><img src="${item.flag}"/> ${item.nationality}</td><td>${item.languages}</td><td class="centerCell">${item.timeInGrade}</td><td class="centerCell">${item.ratingIR}</td><td>${item.comment}</td></tr>`;
            lastGrade = item.grade;
        }//end createTable()
    let g = header + fileContent + footer;
    document.querySelector("#output").innerHTML = g;
}
function hideShowSettings (){//Event handler for hide settings button
  document.getElementById("settings").classList.toggle("hidden")
}

//This block is just HTML generators for drop-down list to select aircraft type. 
// It can be done easier with React, but did not want to use large library for small task
let aircraftType = "";
let type1, type2, type3;
let field2 = document.getElementById("select3");
let field1 = document.getElementById("select2");

const aircraftSelection1 = (type) => {
    field2.innerHTML = ``;
    type1 = type;
    switch (type) {
        case "A380":
            field1.innerHTML =
                `<select name="aircraftType2" id="aircraftType2" onchange="aircraftSelectionA380(this.value)">
                    <option value="1" disabled="" selected="" hidden>Select type</option>
                    <option value="_3class">3/4 class</option>
                    <option value="_2class">2 class</option>
                    <option value="_cargoInHold">Cargo in hold</option>
                </select>`;
        break;
        case "B772":
            field1.innerHTML = ``;
            aircraftType = type;
        break;
        case "B773":
            field1.innerHTML =
                `<select name="aircraftType2" id="aircraftType2" onchange="aircraftSelectionB773(this.value)">
                    <option value="1" disabled="" selected="" hidden>Select type</option>
                    <option value="_3class">3 class</option>
                    <option value="_2class">2 class</option>
                    <option value="_cargo">Cargo</option>
                    <option value="_cargoModified">Cargo modified cabin</option>
                </select>`;
        break;
        default:
            console.error("Aircraft type selected incorrectly !");
        break;
    }//end switch
}
const aircraftSelectionA380 = (type) => {
    type2 = type;
    switch (type) {
        case "_2class":
        case "_3class":
            field2.innerHTML =
                `<select name="aircraftType3" id="aircraftType3" onchange="aircraftSelection3(this.value)">
                    <option value="1" disabled="" selected="" hidden>Select type</option>
                    <option value="_ULR">ULR</option>
                    <option value="_nonULR">nonULR</option>
                </select>`;
        break;
        case "_cargoInHold":
                field2.innerHTML = ``;
                aircraftType = type1+type2;
        break;
    }
}
const aircraftSelectionB773 = (type) => {
    type2 = type;
    switch (type) {
        case "_2class":
        case "_3class":
            field2.innerHTML =``;
            aircraftType = type1+type2;
        break;
        case "_cargoModified":
            field2.innerHTML =
                `<select name="aircraftType3" id="aircraftType3" onchange="aircraftSelection3(this.value)">
                    <option value="1" disabled="" selected="" hidden>Select type</option>
                    <option value="_ULR">ULR</option>
                    <option value="_nonULR">nonULR</option>
                </select>`;
        break;
        case "_cargo":
            field2.innerHTML =
                `<select name="aircraftType3" id="aircraftType3" onchange="aircraftSelection3(this.value)">
                    <option value="1" disabled="" selected="" hidden>Select type</option>
                    <option value="_ULR">ULR</option>
                    <option value="_ETOPS">ETOPS, over 5 hours</option>
                    <option value="_nonULR">nonULR</option>
                </select>`;
        break;
  }
}
const aircraftSelection3 = (type) => {
    type3 = type;
    aircraftType = type1 + type2 + type3;
}

//Other HTML related secondary functions
const dataStats = (input) => {
    data = input;
    document.getElementById('dataLength').innerHTML = input.length;
}
function loadNumberOfSectors () {
    const m = document.querySelector("#numberOfSectors").value;
    numberOfSectors = m;
    positionsObject = {}
    for (let i=1;i<=m;i++){
        positionsObject[`position${i}`]="";
        if (hasBreaks){
            positionsObject[`break${i}`]="";
        } //end if
    } //end for
}
function loadBreakes () {
    const k = document.querySelector("#breaks").checked;
    hasBreaks=k;
}

//Constants. Ideally should be moved to separate module
const EXTRA = {
    A380_3class_ULR: ["MR3A"],
    A380_3class_nonULR: ["MR3A", "MR2A"],
    A380_2class_ULR: ["MR3A", "MR2A", "ML4A", "MR4A"],
    A380_2class_nonULR: ["MR3A", "MR2A", "ML4A", "MR4A"],
    B773_2class: ["R5A"],
    B773_3class: ["R5A"],
    B772: ["R4A"],
    B773_cargo_ULR: ["L3", "L4", "R4", "R3", "L5", "R5"],
    B773_cargo_ETOPS: ["R2", "L3", "L4", "R4", "R3", "L5", "R5"],
    B773_cargo_nonULR: ["L2", "R2", "L3", "L4", "R4", "R3", "L5", "R5"],
    B773_cargoModified_ULR: ["R1", "R2", "L3", "L4", "R4", "R3"],
    B773_cargoModified_nonULR: ["R1", "R2", "L3", "L4", "R4", "R3", "L5"],
    A380_cargoInHold: ["MR2", "ML2", "ML2A", "MR2A", "ML3", "MR3", "ML3A", "MR3A", "ML4", "MR4", "ML4A", "MR4A", "ML5", "MR5", "UL1", "UR1", "UR1A", "UL1A", "UL2", "UR2", "UL3", "UR3"]
}
// Inflight retail used to be separate category of positions, but removed since new procedure is assign to top seller
// regardless of grade. 
const A380_3class_ULR = {//On ULR 2 CSV in YC
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["ML5", "UL1A", "ML1"]},
    FG1: {galley: ["MR2A"], main: ["UR1", "UL1"]},
    GR1: {galley: ["ML3A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A", "MR4A"]},
    GR2: {galley: ["ML2", "MR4"], main: ["MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
    CSA: {galley: [], main: ["CSA"]} //seats at ML2A
};
const A380_3class_nonULR = { //9 Gr2s on main deck
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["ML5", "UL1A"]},
    FG1: {galley: ["UL1"], main: ["UR1"]},
    GR1: {galley: ["ML3A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A", "MR4A"]},
    GR2: {galley: ["ML2", "MR4"], main: ["ML1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
    CSA: {galley: [], main: ["CSA"]} //seats at ML2A
};
const A380_2class_ULR = {//On ULR 2 CSV in YC
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["ML5", "UL1A", "ML1"]},
    FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculationg outOfGrade()
    GR1: {galley: ["ML3A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A"]},
    GR2: {galley: ["UC1", "ML2", "MR4"], main: ["UR1", "UL1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
    CSA: {galley: [], main: ["CSA"]} //seats at ML2A, temporary available on all flights during COVID
};
const A380_2class_nonULR = {//9 Gr2s on main deck
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["ML5", "UL1A"]},
    FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculationg outOfGrade()
    GR1: {galley: ["ML3A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A"]},
    GR2: {galley: ["UC1", "ML2", "MR4"], main: ["UR1", "UL1", "ML1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
    CSA: {galley: [], main: ["CSA"]} //seats at ML2A, temporary available on all flights during COVID
};
const B773_2class = {
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["L5"]},
    FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculationg outOfGrade()
    GR1: {galley: ["L1A"], main: ["L1", "R1"]}, // L1A seated at R1A
    GR2: {galley: ["R5", "L5A"], main: ["L2", "L3", "L4", "R4", "R3", "R2"]},
    CSA: {galley: [], main: ["CSA"]} //seats at R5C, temporary available on all flights during COVID
};
const B773_3class = {
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["L5", "R2A"]},
    FG1: {galley: ["L1"], main: ["R1"]},
    GR1: {galley: ["L2A"], main: ["L2", "R2"]},
    GR2: {galley: ["R5", "L5A"], main: ["L3", "L4", "R4", "R3"]},
    CSA: {galley: [], main: ["CSA"]} //seats at R5C, temporary available on all flights during COVID
};
const B772 = {
    PUR: {galley: [],main: ["PUR"]},
    CSV: {galley: [],main: ["L4"]},
    FG1: {galley: [], main: []},
    GR1: {galley: ["L1A"], main: ["L1", "R1", "R1A"]}, //L1A seated at L4C
    GR2: {galley: ["R4", "L4A"], main: ["L3", "L2", "R2", "R3"]},
    CSA: {galley: [], main: ["CSA"]} //seats at R4C, temporary available on all flights during COVID
};
const B773_cargoModified_nonULR = ["L1", "L2", "R5"];
const B773_cargoModified_ULR = ["L1", "L2", "R5", "L5"];
const B773_cargo_nonULR = ["L1", "R1"];
const B773_cargo_ETOPS = ["L1", "R1", "L2"];
const B773_cargo_ULR = ["L1", "R1", "L2", "R2"];
const A380_cargoInHold = ["MR1", "ML1"]