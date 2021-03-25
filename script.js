let data, positions;
let crewList = [];
let VCM=0, numberOfSectors=1
let outOfGrade = {}, positionsObject = {position1: ""};
let hasBreaks = false;

function generate () { //main function
    loadBreaks();
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
        if(hasBreaks){selectBreaks();}
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
        case "B773_2class_ULR":
        case "B773_2class_nonULR":
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
        case "B773_3class_ULR":
        case "B773_3class_nonULR":
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
        case "B772_2class_ULR":
        case "B772_2class_nonULR":
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
    if(hasBreaks){
        let h = crc === -1 ? breaks[plane][op2.value]["HBS"][classes]["GR2"] : breaks[plane][op2.value][crc === 1? "CRC" : crc === 2? "LD" : "MD"]["GR2"];
        for(let y=1; y<VCM; y++){
            h.pop();
        }
    }
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
            if(!aircraftType.includes("cargo"))
            {if (lastGrade == "") {
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
            }}
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

//HTML related secondary functions
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
function loadBreaks () {
    const k = document.querySelector("#breaks").checked;
    hasBreaks=k;
}

//Constants. Ideally should be moved to separate module
const EXTRA = {
    A380_3class_ULR: ["MR3A"],
    A380_3class_nonULR: ["MR3A", "MR2A"],
    B773_cargo_ULR: ["L3", "L4", "R4", "R3", "L5", "R5"],
    B773_cargo_ETOPS: ["R2", "L3", "L4", "R4", "R3", "L5", "R5"],
    B773_cargo_nonULR: ["L2", "R2", "L3", "L4", "R4", "R3", "L5", "R5"],
    B773_cargoModified_ULR: ["R1", "R2", "L3", "L4", "R4", "R3"],
    B773_cargoModified_nonULR: ["R1", "R2", "L3", "L4", "R4", "R3", "L5"],
    A380_cargo_cargoInHold: ["MR2", "ML2", "ML2A", "MR2A", "ML3", "MR3", "ML3A", "MR3A", "ML4", "MR4", "ML4A", "MR4A", "ML5", "MR5", "UL1", "UR1", "UR1A", "UL1A", "UL2", "UR2", "UL3", "UR3"]
}
EXTRA.A380_2class_nonULR = EXTRA.A380_2class_ULR = ["MR3A", "MR2A", "ML4A", "MR4A"];
EXTRA.B773_2class_ULR = EXTRA.B773_2class_nonULR = EXTRA.B773_3class_ULR = EXTRA.B773_3class_nonULR = ["R5A"];
EXTRA.B772_2class_ULR = EXTRA.B772_2class_nonULR = ["R4A"];
// Inflight retail used to be separate category of positions, but removed since new procedure is assign to top seller regardless of grade. 
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
const B773_2class_ULR = {
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["L5"]},
    FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculationg outOfGrade()
    GR1: {galley: ["L1A"], main: ["L1", "R1"]}, // L1A seated at R1A
    GR2: {galley: ["R5", "L5A"], main: ["L2", "L3", "L4", "R4", "R3", "R2"]},
    CSA: {galley: [], main: ["CSA"]} //seats at R5C, temporary available on all flights during COVID
};
const B773_2class_nonULR = B773_2class_ULR;
const B773_3class_ULR = {
    PUR: {galley: [], main: ["PUR"]},
    CSV: {galley: [], main: ["L5", "R2A"]},
    FG1: {galley: ["L1"], main: ["R1"]},
    GR1: {galley: ["L2A"], main: ["L2", "R2"]},
    GR2: {galley: ["R5", "L5A"], main: ["L3", "L4", "R4", "R3"]},
    CSA: {galley: [], main: ["CSA"]} //seats at R5C, temporary available on all flights during COVID
};
const B773_3class_nonULR = B773_3class_ULR;
const B772_2class_ULR = {
    PUR: {galley: [],main: ["PUR"]},
    CSV: {galley: [],main: ["L4"]},
    FG1: {galley: [], main: []},
    GR1: {galley: ["L1A"], main: ["L1", "R1", "R1A"]}, //L1A seated at L4C
    GR2: {galley: ["R4", "L4A"], main: ["L3", "L2", "R2", "R3"]},
    CSA: {galley: [], main: ["CSA"]} //seats at R4C, temporary available on all flights during COVID
};
const B772_2class_nonULR = B772_2class_ULR;
const B773_cargoModified_nonULR = ["L1", "L2", "R5"];
const B773_cargoModified_ULR = ["L1", "L2", "R5", "L5"];
const B773_cargo_nonULR = ["L1", "R1"];
const B773_cargo_ETOPS = ["L1", "R1", "L2"];
const B773_cargo_ULR = ["L1", "R1", "L2", "R2"];
const A380_cargo_cargoInHold = ["MR1", "ML1"]

// Breaks allocation
// Breaks numbers sequential for GR2 as they pop() when handling VCM (removing last break in the list)
const breaks = {
    B773 : {
        ULR: {
            CRC: {PUR: 3, "R4 (R2A)": 1, R2A: 1, L5: 2, CSA: 1, FG1:[1,2], GR1:[1,2,2], GR2:[1,2,1,2,1,2]},
        }
    },
    B772 : {
        ULR : {
            CRC: {PUR: 2, R1A: 1, L4: 2, CSA: 1, GR1:[1,2,2], GR2:[1,2,1,2,1,2]},
        }
    },
    A380 : {
        ULR: {
            LD: {PUR: 2, "MR1 (ML1)":2, ML1: 2, UL1A: 1, ML5: 1, CSA: 1, FG1:[1,2,3], GR1:[1,1,1,1,2,2,2,2], GR2:[1,2,1,2,1,2,1,2]},
            MD: {PUR: 2, "MR1 (ML1)":3, ML1: 3, UL1A: 1, ML5: 1, CSA: 1, FG1:[1,2,3], GR1:[1,2,2,2,2,3,3,3], GR2:[1,3,1,3,1,3,1,3]}
        },
        nonULR: {// YC only 1 CSV and 9 Gr2
            LD: {PUR: 2, UL1A: 1, ML5: 2, CSA: 1, FG1:[1,2,3], GR1:[1,1,1,1,2,2,2,2], GR2:[1,2,1,2,1,2,1,2,1]},
            MD: {PUR: 3, UL1A: 2, ML5: 1, CSA: 1, FG1:[1,2,3], GR1:[1,1,1,2,2,3,3,3], GR2:[1,2,3,1,2,3,1,2,3]},
            HBS: {
                3: {PUR: 4, UL1A: 2, ML5: 3, CSA: 1, FG1:[1,2,3], GR1:[1,1,2,2,3,3,4,4], GR2:[1,2,3,4,1,2,3,4,4]}, //3 class
                2: {PUR: 4, ML5: 1, ML1:3, UL1A: 2, CSA: 1, GR1:[1,1,2,3,3,4], GR2:[1,2,3,4,1,2,3,4,2,3,4]} // 2 class
            }
        }
    }
};
breaks.B773.nonULR = {// CRC or HBS (hard blocked seats)
            CRC: breaks.B773.ULR.CRC,
            HBS : {
                3: {PUR: 4, R2A: 2, L5: 3, CSA: 3, FG1:[1,2], GR1:[1,3,4], GR2:[1,2,3,4,1,2]}, // 3 class
                2: {PUR: 4, L5: 2, CSA: 3, GR1:[1,2,3], GR2:[1,2,3,4,1,2,3,4]}, //B777-300 2 class
            }
        };
breaks.B772.nonULR = {CRC : breaks.B772.ULR.CRC};
function selectBreaks () {
    let f = [];
    // I don't like next line of code, but there was no other way to clone deep nested object (spread operator or Object.assign() led to shallow copy of the original object. I also did not want to use side libraries like lodash for this task)
    for (let z = 1; z<=numberOfSectors; z++){//Idex 0 of this array will be empty value for clarity in sector numbers
        f[z] = JSON.parse(JSON.stringify(crc === -1 ? breaks[plane][op2.value]["HBS"][classes] :
        breaks[plane][op2.value][crc === 1? "CRC" : crc === 2? "LD" : "MD"]))
    }
    crewList.forEach(crew => {
        if(crew.grade ==="PUR" || crew.grade === "CSV" || crew.grade === "CSA"){ //For positions with specific break in crew rest strategy
            for (let s = 1; s<=numberOfSectors; s++){
                crew[`break${s}`]=f[s][crew[`position${s}`]]
            }
        }
        else {
            for (let t = 1; t<=numberOfSectors; t++){
                let r;
                if (crewList.filter( x => x.grade === crew.grade).length === 3){//with 3 Gr1 one person will have same break on few sectors, so break rotation rule does not apply
                    r= getRandomNumber(0, f[t][crew.grade].length-1);
                    crew[`break${t}`]=f[t][crew.grade][r];
                    f[t][crew.grade].splice(r,1);
                }
                else{
                    do{ r= getRandomNumber(0, f[t][crew.grade].length-1); // This rule ensures positions rotation between sectors
                        crew[`break${t}`]=f[t][crew.grade][r]}
                    while(crew[`break${t}`]===crew[`break${t-1}`])
                    f[t][crew.grade].splice(r,1);
                }
            }
        }
    })//end forEach(crew)
}

//Aircraft types for breaks calculation according to registration number
const fleet = {
    //B777
    FHS: {reg: ['QH', 'QI','QJ', 'QK','QL', 'QM', 'QN','QO','QP'], description: "B773 Full heigh suits (with CRC)", crc: 1, planeType: "B773", classes: 3}, 
    CRC: {reg: ['BQ','BR', 'BU', 'BW', 'BY', 'CA', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ','CK','CM','CN','CO','CP','CQ','CR','CS','CT','CU','CV','CW','CX','GA','GB','GC','GE','GF','GH','GI'], description: "B773 3 class (with CRC)", crc: 1, planeType: "B773", classes: 3}, 
    FS3: {reg: ['PV','PW','PX','PY','PZ','QA','QF','QB','QC','QD','QE','QG'], description: "B773 3 class Falcon seats (with CRC)", crc: 1, planeType: "B773", classes: 3}, 
    FS2: {reg: ['WA', 'WB','WC','WD','WE','WF','WG','WH','WI','WJ'], description: "B772 2 class Falcon seats (with CRC)", crc: 1, planeType: "B772", classes: 2}, 
    CMC: {reg: ['BJ','BK','BM','BN','BO','GD','GG','GK','GN','GP','GT','GU','GW'], description: "B773 Cargo modified cabin", crc: -1, planeType: "B773", classes: 0}, 
    HB2: {reg: ['CY','CZ','NA','NB','NC','ND','NF','NH','NI','NO','NW','NY','PE','PG','PQ','PR','PT'], description: "B773 2 class (Hard blocked seats)", crc: -1, planeType: "B773", classes: 2}, 
    HB3: {reg: ['GJ','GL','GM','GO','GQ','GR','GS','GV','GX','GY','GZ','NE','NG','NJ','NK','NL','NM','NN','NP','NQ','NR','NS','NT','NU','NV','NX','NZ','PA','PB','PC','PD','PF','PH','PI','PJ','PK','PL','PM','PN','PO','PP','PS','PU'], description: "B773 3 class (Hard blocked seats)", crc: -1, planeType: "B773", classes: 3},
    //A380 
    ANC: {reg: [/*517 seats*/ 'DF', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DL', 'DQ', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX', 'EA', 'EB', 'EC', 'ED', 'EE', 'EI', 'EJ', 'EN', 'ER', 'ES', /*519 seats*/ 'EW', 'EX', 'EY', 'EZ', 'OA', 'OB', 'OI','OJ', 'OK','OO','OT','OU','OV','OW','OZ','UA','UC','UB','UD','UM'], description: "A380 3 class (no CRC)", crc: -1, planeType: "A380", classes: 3}, 
    A2C: {reg: ['OP','OQ','OR','OS','OX','OY','UN','UO','UP','UQ','UX','UY','UZ','VA','VB'], description: "A380 2 class (no CRC)", crc: -1, planeType: "A380", classes: 2}, 
    AMD: {reg: [/*489 seats*/ 'DA','DC','DD','DE','DM','DN','DO','DP','DY','DZ','EF','EG','EH','EK','EL','EM','EO','EP','EQ','ET', /*491 seats */ 'EV','OC','OD','OE','OF','OG','OH','OL','OM','ON'], description: "A380 3 class (Main deck CRC)", crc: 3, planeType: "A380", classes:3}, 
    ALD: {reg: ['UE', 'UF', 'UG', 'UH', 'UI', 'UJ', 'UK', 'UL', 'UR', 'US', 'UT', 'UU'], description: "A380 3 class (Lower deck CRC)", crc: 2, planeType: "A380", classes: 3}, 
    ANL: {reg: ['UV', 'UW', 'VC', 'VD', 'VE', 'VF', 'VG', 'VH', 'VI', 'VJ', 'VK', 'VL', 'VM'], description: "A380 3 class New lounge (Lower deck CRC)", crc: 2, planeType: "A380", classes:3}
}
//Select aircraft type. HTML manipulations
let aircraftType, plane, classes, crc;
const op1 = document.querySelector("#operation1");
const op2 = document.querySelector("#operation2");
const etops = document.querySelector("#etops");
const pax = document.querySelector("#pax");
const cargo = document.querySelector("#cargo");
const hold = document.querySelector("#hold");
const ulr = document.querySelector("#ulr");
const nonulr = document.querySelector("#nonulr");
function aircraftSelector (input){
    let desc = document.querySelector("#description");
    let match = false;
    if(input.length = 2){
        Object.keys(fleet).forEach((type)=>{
            if(fleet[type].reg.includes(input.toUpperCase())){
                desc.innerHTML = fleet[type].description;
                match = true;
                plane=fleet[type].planeType;
                classes = fleet[type].classes;
                crc = fleet[type].crc; // CRC parameters: -1 -> no crc, 1 -> crc, 2 -> A380 LD CRC, 3 -> A380 MD CRC
            }
        })
        if (!match){desc.innerHTML = "No such registration"}
    }
    else {desc.innerHTML = "Full registration required"}
    adjustSelection();
}
function adjustSelection (){
    //Defaults
    if(pax.hasAttribute('hidden')){pax.removeAttribute('hidden');}
    if(ulr.hasAttribute('hidden')){ulr.removeAttribute('hidden');}
    if(nonulr.hasAttribute('hidden')){nonulr.removeAttribute('hidden');}
    if(!etops.hasAttribute('hidden')){etops.setAttribute('hidden', "");}
    if(!hold.hasAttribute('hidden')){hold.setAttribute('hidden', "");}
    if(op2.selectedIndex == "2" && op1.selectedIndex == "0"){op2.selectedIndex = "0"}
    if(op2.selectedIndex == "3" && op1.selectedIndex == "0"){op2.selectedIndex = "0"}
    if(op2.selectedIndex == "3" && plane !== "A380"){op2.selectedIndex = "0"}
    //Cargo modified cabin
    if(classes===0){
        if(!pax.hasAttribute('hidden')){pax.setAttribute('hidden', ""); }
        op1.selectedIndex = "1";
    }
    //Extra operation type for B773 cargo flights
    else if(op1.value==="cargo" && plane === "B773"){
        if(etops.hasAttribute('hidden')){etops.removeAttribute('hidden')}
    }
    //A380 cargo
    else if(op1.value==="cargo" && plane === "A380"){
        if(hold.hasAttribute('hidden')){hold.removeAttribute('hidden');}
        if(!ulr.hasAttribute('hidden')){ulr.setAttribute('hidden', "");}
        if(!nonulr.hasAttribute('hidden')){nonulr.setAttribute('hidden', "");}
        op2.selectedIndex = "3"
    }
    operationSelector();
}
function operationSelector (){
    // This function is build on legacy objects so its not perfect. If object names will be unified it can look much nicer
    aircraftType = `${plane}_${op1.value === "pax" ? classes+"class": (classes === 0? "cargoModified" : "cargo" )}_${op2.value}`;
}