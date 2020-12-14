let aircraftType = "";
let type1, type2, type3;
let field2 = document.getElementById("select3");
let field1 = document.getElementById("select2");
let positions;
let VCM=0;

let data;
let crewList = [];
let numberOfSectors=1, positionsObject = {position1: ""};
let hasBreaks = false;

//----Crew data, flight data
const dataStats = (input) => {
data = input;
document.getElementById('dataLength').innerHTML = input.length;




}




function selectIR (){
  crewList.sort((a, b) => a.ratingIR - b.ratingIR);
  let x = aircraftType.includes('A380') ? 2 : 1;
  for (let i=0; i<x; i++){
    crewList[i].inflightRetail = true;
  }
}
function selectPositions (s){
  let positionsActive = {...positions}
  Object.keys(positionsActive).forEach((grade)=>{
    
    if(positionsActive[grade] !== "EXTRA"){
    Object.keys(positionsActive[grade]).forEach((type)=>{
      if (positionsActive[grade][type].length!==0){
      positionsActive[grade][type].forEach((position)=>{
          const filteredCrew = crewList.filter( x => 
          x.grade === grade && x.timeInGradeNumber > 6 && x[`position${s}`]==="");
          filteredCrew[0][`position${s}`] = position;
  
    })//position
  
  }//if type

})//type
    }//if grade = extra
  }  )//positionActive
}






//----Aircraft type selectors
const aircraftSelection1 = (type) => {
  field2.innerHTML = ``;
  type1 = type;
  switch (type) {
    case "A380":
      field1.innerHTML =
        `<select name="aircraftType2" id="aircraftType2" onchange="aircraftSelectionA380(this.value)">
        <option value="1" disabled="" selected="" hidden>Select type</option>
      <option value="_3class">3 class</option>
      <option value="_2class">2 class</option>
    </select>`;
      break;
    case "B772":
      field1.innerHTML = ``;
      aircraftType = type;
// loadPositions(aircraftType);
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
      console.log("Aircraft type selected incorrectly !");
      break;
  }
}
const aircraftSelectionA380 = (type) => {
  type2 = type;
  field2.innerHTML =
    `<select name="aircraftType3" id="aircraftType3" onchange="aircraftSelection3(this.value)">
    <option value="1" disabled="" selected="" hidden>Select type</option>
        <option value="_ULR">ULR</option>
        <option value="_nonULR">nonULR</option>
      </select>`;
}
const aircraftSelectionB773 = (type) => {
  type2 = type;
  switch (type) {
    case "_2class":
    case "_3class":
      field2.innerHTML =``;
      aircraftType = type1+type2;
// loadPositions(aircraftType);
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
  // loadPositions(aircraftType)
}
const loadPositions = (aType) => {
  positions = { ...eval(aType) };
  let field = document.getElementById('positions');
  field.innerHTML = JSON.stringify(positions);
  //VCM check
  let positionsList = [];
  Object.keys(positions).forEach((grade)=>{
    if (grade != "EXTRA"){
      Object.keys(positions[grade]).forEach((group)=>{
        positions[grade][group].forEach((item)=>{
                  positionsList.push(item)}
          )
    });
    }
})
// console.log(positionsList)
if (crewList.length !== positionsList.length) {
  VCM = positionsList.length-crewList.length;
  console.log(`VCM ${VCM} operation`)
  if (VCM >0){ VCMrules()}
  if (VCM <0){ extraRules()}
 
}
//End of VCM check
}
function extraRules(){
  //For rare case, when operating with additional crew. This happens when for example 3 class crew set on return sector operates 2 class aircraft 
  //placeholder
}
function VCMrules (){
//CSA check
const filteredCrew = crewList.filter( x => 
  x.grade === "CSA");
  if (filteredCrew.length === 0){
    positions.CSA.main.pop();
    positions.GR2.main.push("CSA")
  }
//Crew positions adjustment
  switch(aircraftType) {
    case "A380_3class_ULR":
    case "A380_3class_nonULR":
      //=======================
        if (VCM >= 1){ //Because CSA conted towards total crew compliment. If no CSA (VCM 1) it will be adjusted in previous lines of code
          positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
          positions.GR2.main.splice(positions.GR2.main.indexOf("MR3"),1);
          positions.GR2.main.push("MR3 (CSA)");
        }
        if (VCM >= 2){ 
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
          positions.GR1.main.splice(positions.GR1.main.indexOf("ML3A"),1)
          positions.GR1.main.push("ML3 (ML3A)")
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
      //===========================
      break;
    case "A380_2class_ULR":
    case "A380_2class_nonULR":
      //=======================
      if (VCM >= 1){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("MR3"),1);
        positions.GR2.main.push("MR3 (CSA)");
      }
      if (VCM >= 2){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("ML3"),1)
        positions.GR1.main.splice(positions.GR1.main.indexOf("ML3A"),1)
        positions.GR1.main.push("ML3 (ML3A)")
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
    //===========================
    break;
    case "B773_2class":
      //=======================
      if (VCM >= 1){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("R3"),1);
        positions.GR2.main.push("R3 (CSA)");
      }
      if (VCM >= 2){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("L5A"),1);
      }
      if (VCM >= 3){ 
        positions.GR1.main.splice(positions.GR1.main.indexOf("L1A"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("R2"),1);
        positions.GR1.main.push("R2 (L1A)");
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
      //========================
      break;
    case "B773_3class":
      //=======================
      if (VCM >= 1){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("R3"),1);
        positions.GR2.main.push("R3 (CSA)");
      }
      if (VCM >= 2){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("L5A"),1);
      }
      if (VCM >= 3){ 
        positions.GR1.main.splice(positions.GR1.main.indexOf("L2A"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("L4"),1);
        positions.GR1.main.push("L4 (L2A)");
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
      case "B772":
      //=======================
      if (VCM >= 1){ 
        positions.GR2.main.splice(positions.GR2.main.indexOf("CSA"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("R3"),1);
        positions.GR2.main.push("R3 (CSA)");
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
        positions.GR1.main.splice(positions.GR1.main.indexOf("L1A"),1);
        positions.GR2.main.splice(positions.GR2.main.indexOf("L2"),1);
        positions.GR1.main.push("L2 (L1A)");
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
      //========================
      break;
    default:
      console.error("Aircraft type not found!")
  }
  // console.log(positions)
}

// order positions matter - more important first
// how to make sure doors covered
// DF used to be separate category but removed since new procedure is assign to top seller
// add field CSA:true DF:true
const A380_3class_ULR = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["ML5", "UL1A", "ML1"]
  },
  FG1: {
    galley: ["MR2A"],
    main: ["UR1", "UL1"]
  },
  GR1: {
    galley: ["ML3A"],
    main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A", "MR4A"]
  },
  GR2: {
    galley: ["ML2", "MR4"],
    main: ["MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at ML2A
  EXTRA: ["MR3A"]
};
const A380_3class_nonULR = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["ML5", "UL1A"]
  },
  FG1: {
    galley: ["UL1"],
    main: ["UR1"]
  },
  GR1: {
    galley: ["ML3A"],
    main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A", "MR4A"]
  },
  GR2: {
    galley: ["ML2", "MR4"],
    main: ["ML1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at ML2A
  EXTRA: ["MR3A", "MR2A"]
};
const A380_2class_ULR = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["ML5", "UL1A", "ML1"]
  },
  GR1: {
    galley: ["ML3A"],
    main: ["UL2", "UR2", "UL3", "UR3", "UR1A"]
  },
  GR2: {
    galley: ["UC1", "ML2", "MR4"],
    main: ["UR1", "UL1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at ML2A, temporary available on all flights during COVID
  EXTRA: ["MR3A", "MR2A", "ML4A", "MR4A"]
};
const A380_2class_nonULR = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["ML5", "UL1A"]
  },
  GR1: {
    galley: ["ML3A"],
    main: ["UL2", "UR2", "UL3", "UR3", "UR1A"]
  },
  GR2: {
    galley: ["UC1", "ML2", "MR4"],
    main: ["UR1", "UL1", "ML1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at ML2A, temporary available on all flights during COVID
  EXTRA: ["MR3A", "MR2A", "ML4A", "MR4A"]
};
const B773_2class = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["L5"]
  },
  GR1: {
    galley: ["L1A"],
    main: ["L1", "R1"]
  }, // L1A seated at R1A
  GR2: {
    galley: ["R5", "L5A"],
    main: ["L2", "L3", "L4", "R4", "R3", "R2"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at R5C, temporary available on all flights during COVID
  EXTRA: ["R5A"]
};
const B773_3class = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["L5", "R2A"]
  },
  FG1: {
    galley: ["L1"],
    main: ["R1"]
  },
  GR1: {
    galley: ["L2A"],
    main: ["L2", "R2"]
  },
  GR2: {
    galley: ["R5", "L5A"],
    main: ["L3", "L4", "R4", "R3"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at R5C, temporary available on all flights during COVID
  // EXTRA: {
  //   main: ["R5A"]}
};
const B772 = {
  PUR: {
    galley: [],
    main: ["PUR"]
  },
  CSV: {
    galley: [],
    main: ["L4"]
  },
  GR1: {
    galley: ["L1A"],
    main: ["L1", "R1", "R1A"]
  }, //L1A seated at L4C
  GR2: {
    galley: ["R4", "L4A"],
    main: ["L3", "L2", "R2", "R3"]
  },
  CSA: {
    galley: [],
    main: ["CSA"]
  }, //seats at R4C, temporary available on all flights during COVID
  EXTRA: ["R4A"]
};
const B773_cargoModified_nonULR = {
  CREW: ["L1", "L2", "R5"],
  EXTRA: ["R1", "R2", "L3", "L4", "R4", "R3", "L5"]
};
const B773_cargoModified_ULR = {
  CREW: ["L1", "L2", "R5", "L5"],
  EXTRA: ["R1", "R2", "L3", "L4", "R4", "R3"]
};
const B773_cargo_nonULR = {
  CREW: ["L1", "R1"],
  EXTRA: ["L2", "R2", "L3", "L4", "R4", "R3", "L5", "R5"]
};
const B773_cargo_ETOPS = {
  CREW: ["L1", "R1", "L2"],
  EXTRA: ["R2", "L3", "L4", "R4", "R3", "L5", "R5"]
};
const B773_cargo_ULR = {
  CREW: ["L1", "R1", "L2", "R2"],
  EXTRA: ["L3", "L4", "R4", "R3", "L5", "R5"]
};


const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function loadCrew (){
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/html');
  crewList = [];
let crew= [];
crew = doc.getElementsByClassName('crew-card')
let counter=1;//counld not get id of items in HTMLcollection properly, so added thsi ocunter for simple sorting later
for (let n of crew){
const nickname = n.getElementsByClassName('nickname')[0].innerHTML
const staffNumber = n.getElementsByClassName('id')[0].innerHTML.slice(1)
const fullname = n.getElementsByClassName('fullname')[0].innerHTML
const grade = n.getElementsByClassName('grade')[0].innerHTML
const content = n.getElementsByClassName('crew-content')[0].innerHTML
const badges = n.getElementsByClassName('badges')[0].innerHTML



const nationality =
// content.substring(
//   content.indexOf(
//     `<img src="https://emiratesgroup.sharepoint.com/sites/ccp/Shared Documents/ACI/country/`
//   ),
//   content.indexOf(`.png" alt>  </p>`) + 10
// ) +
content.substring(
  content.indexOf("ality:</b>")+10,
  content.indexOf(`&nbsp;`)
)
  .replace("Korea, Republic Of", "Korea")
  .replace("Czech Republic", "Czech")
  .replace("Taiwan, Province Of China", "Taiwan")
  .replace("United Arab Emirates", "UAE")
  .replace("Russian Federation", "Russia");

const languages = content.substring(
content.indexOf("Languages:</b> ") + 15,
content.indexOf(`</p>      <p><b>CCM:`)
).replace("Ukranian", "Ukrainian");


let timeInGrade;
if (content.includes("Years") === -1) {
timeInGrade =
  content.substring(
    content.indexOf("<b>Grade Exp: </b>") + 18,
    content.indexOf("Year")-1
  ) +
  "y " +
  content.substring(
    content.indexOf("Year") + 6,
    content.indexOf("Month")-1
  ) +
  "m";
} else {
timeInGrade =
  content.substring(
    content.indexOf("<b>Grade Exp: </b>") + 18,
    content.indexOf("Year")-1
  ) +
  "y " +
  content.substring(
    content.indexOf("Year") + 5,
    content.indexOf("Month")-1
  ) +
  "m";
}
let y = parseInt(timeInGrade.substring(0, timeInGrade.indexOf("y")));
let m = parseInt(timeInGrade.substring(timeInGrade.indexOf("y")+1, timeInGrade.indexOf("m")));
let timeInGradeNumber = m+y*12;


let ratingIR = 21; 
if (badges.includes("EMIRATESRED TOP SELLER")) {
ratingIR = parseInt(badges.substring(badges.indexOf('SELLER'), badges.indexOf("SELLER")+9 ).slice(-2));
}

let comment = "";
if (n.getElementsByClassName("comment").length >= 1) {
comment = n.getElementsByClassName("comment")[0].innerHTML;
}

let count = counter;

crewList.push({
  count,
  grade,
  nickname,
  fullname,
  nationality,
  ratingIR,
  comment,
  staffNumber,
  languages,
  timeInGrade,
  timeInGradeNumber,
  inflightRetail: false,
  ... positionsObject
  }) 
counter++;
}//for n of crew
// console.log(crewList)
}
  const loadNumberOfSectors = () => {
    const m = document.querySelector("#numberOfSectors").value;
    numberOfSectors = m;
    positionsObject = {}
    for (let i=1;i<=m;i++){
      positionsObject[`position${i}`]="";
      if (hasBreaks){
        positionsObject[`break${i}`]="";
      }
    }
  }
const breaksLoad = () => {
  const k = document.querySelector("#breaks").checked;
  hasBreaks=k;};





function generate () {
  breaksLoad();
  loadNumberOfSectors();
  loadCrew();
  loadPositions(aircraftType);
  console.log(positionsObject)
  selectIR();
  for (let s=1; s<=numberOfSectors; s++){
    selectPositions(s)
  }
  // console.log(crewList)
  createOutput();
}


function createOutput () {
  crewList.sort((a, b) => a.count - b.count);
  let headerInsert = "";

for (const s of Object.keys(positionsObject)){
headerInsert+=`<th>${s}</th>`
}
  const header = `
  <table border="1">  <!--border="1"-->
    <tr>
      <th>Grade</th>
      <th>Nickname</th>
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
    // далее код добавляет рядки-разделители разных кабин
    fileContent += `<tr><td class="centerCell"colspan="11" style="background-color:#F7DC6F"><b>Seniors</b></td></tr>`;
  }
  if (lastGrade !== item.grade && item.grade == "GR1") {
    fileContent += `<tr class="CSA"><td class="centerCell" colspan="11" style="background-color:#5DADE2"><b>Business class</b></td></tr>`;
  }
  if (lastGrade !== item.grade && item.grade == "FG1") {
    fileContent += `<tr><td class="centerCell" colspan="11" style="background-color:#EC7063"><b>First class</b></td></tr>`;
  }
  if (lastGrade !== item.grade && item.grade == "GR2") {
    fileContent += `<tr><td class="centerCell" colspan="11" style="background-color:#52BE80"><b>Economy class class</b></td></tr>`;
  }

  fileContent += `<tr><td class="centerCell">${item.grade}</td><td>${item.nickname}</td><td><div contenteditable>${item.position1}</div></td><td><div contenteditable>${item.position2}</div></td><td>${item.fullname}</td><td class="centerCell">${item.staffNumber}</td><td>${item.nationality}</td><td>${item.languages}</td><td class="centerCell">${item.timeInGrade}</td><td class="centerCell">${item.ratingIR}</td><td>${item.comment}</td></tr>`;
  lastGrade = item.grade;
}//createTable
let g = header + fileContent + footer;
document.querySelector("#output").innerHTML = g;
}