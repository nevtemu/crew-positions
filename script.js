let aircraftType = "";
let type1, type2, type3;
let field2 = document.getElementById("select3");
let field1 = document.getElementById("select2");
let positions;
let data;

const dataStats = (input) => {
data = input;
document.getElementById('dataLength').innerHTML = input.length;
console.log(data)
}
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
loadPositions(aircraftType);
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
loadPositions(aircraftType);
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
  loadPositions(aircraftType)
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
console.log(positionsList)
//End of VCM check
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
  EXTRA: ["R5A"]
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
