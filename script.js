function generate () { //main function
    let positions;
    let VCM;
    let outOfGrade;
    document.querySelector("#output").innerHTML = "";
    let numberOfSectors = loadNumberOfSectors() || 1;
    let crewList = loadCrew();
    let hasBreaks = loadBreaks() || false;
    if (aircraftType.includes("cargo")){
        positions = loadPositionsCargo(aircraftType);
        selectPositionsCargo();
    }
    else {
        let positionsDF = {A380: {3: {FG1: "UR1", GR1: "ML4A", GR2: "MR5"}, 2:{GR1: "UR3", GR2: "MR5"}}, 
                    B773:{2:{GR1: "R1", GR2: "L2"}, 3:{FG1: "R1", GR1: "L2", GR2: "R3"}}, 
                    B772:{2: {GR1: "R1", GR2: "L2"}}};
        positionsDF.A380[4]= positionsDF.A380[3];
        let positionsW = {CSV: ["ML1"], GR2: ["MR3A"]}; //No junior crew allocated W cabin -- only 4 class A380 // Temporarily removed MR1 position to assign W position to a mix of crew
        positions = loadPositions(aircraftType);
        VCM = checkVCM (positions, crewList);
        if(VCM){
            errorHandler(`VCM ${VCM} operation`, "yellow");
            VCM > 0 ? VCMrules(VCM, positions, positionsDF, positionsW) : extraRules(VCM, positions);
        }
        outOfGrade = checkOutOfGrade(positions, crewList);
        if (Object.keys(outOfGrade).length > 0){outOfGradeRules(outOfGrade, crewList)}
        if(classes==4){
            selectW(crewList, positions, numberOfSectors, positionsW)}
        selectIR(crewList, positions, numberOfSectors, positionsDF); // required before selecting positions yo avoid giving galley/lounge to IR operators
        for (let s=1; s<=numberOfSectors; s++){
            selectPositions(s, positions, crewList)}
        if(hasBreaks){selectBreaks(crewList, numberOfSectors, VCM);}
    }//end else
    createOutput(numberOfSectors, hasBreaks, crewList);
}
// DATA LOADERS
function loadBreaks () {
    return document.querySelector("#breaks").checked;
}
function loadNumberOfSectors () {
    return document.querySelector("#numberOfSectors").value;
}
function loadCrew (){
    //Parse text data
    const data = document.querySelector("#crewData").value;
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    let crewData = [];//Clear crew list
    let crewCollection = doc.getElementsByClassName('crew-card');//To temporarily hold HTML collection
    let counter=1; //could not get id of items in HTML collection properly, so added this counter for simple sorting later
    //Iterate through HTML collection to generate array of objects with crew details
    for (let n of crewCollection){
        const nickname = n.getElementsByClassName('nickname')[0].innerHTML
        const staffNumber = n.getElementsByClassName('id')[0].innerHTML.slice(1)
        const fullname = n.getElementsByClassName('fullname')[0].innerHTML
        let grade = n.getElementsByClassName('grade')[0].innerHTML
        const operatingGrade = getPreviousSibling(n.closest('.row-crew'), '.row-crew-heading').lastElementChild.textContent;
        if (operatingGrade !== grade) {errorHandler(`${nickname} out of grade`, 'green'); grade = operatingGrade} 
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
            .replace("Korea, Republic Of", "Korea")//Replace few official countries names for easy reading
            .replace("Moldova, Republic Of", "Moldova")
            .replace("Czech Republic", "Czech")
            .replace("Taiwan, Province Of China", "Taiwan")
            .replace("United Arab Emirates", "UAE")
            .replace("Russian Federation", "Russia")
            .replace("Bosnia And Herzegovina", "Bosnia")
            .replace("Republic Of Macedonia", "Macedonia")
            .trim();
        const languages = content.substring(
            content.indexOf("Languages:</b> ") + 15,
            content.indexOf(`</p>      <p><b>CCM:`) ==-1 ? content.indexOf(`</p><span class="CrewFlightExperience">`) : content.indexOf(`</p>      <p><b>CCM:`) //this check is for rare case, when crew has no CCM
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
        let qualifiedW = badges.includes("PREMIUM ECONOMY CREW") ? true : false;
        let comment = "";
        if (n.getElementsByClassName("comment").length >= 1) {
            comment = n.getElementsByClassName("comment")[0].innerHTML;
        }
        let count;
        switch (grade){//for purpose of sorting and grade segregation on output
            case "PUR": count = counter; break;
            case "CSV": count = 100+counter; break;
            case "FG1": count = 200+counter; break;
            case "GR1": count = 300+counter; break;
            case "GR2": count = 400+counter; break;       
            case "CSA": count = 500+counter; break;
        }
        let lastPosition;
        if (grade === "PUR" || grade === "CSA" ){//previous position length=0 so any position can be repeated
            lastPosition = []}
        else if (grade === "GR1" || grade === "FG1" || grade === "CSV"){//one previous position should not be repeated
            lastPosition = [""]}
        else { //for Gr2 two previous positions should not be repeated
            lastPosition = ["", ""]
        }
        crewData.push({
            count,
            grade,
            nickname: nickname ? nickname : fullname.split(" ")[0],
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
            qualifiedW,
            operatingW : qualifiedW,
            position1:""
            }) 
        counter++;
    }//end (for n of crew)
    return crewData;

    function getPreviousSibling (elem, selector) {
        let sibling = elem.previousElementSibling;
        if (!selector) return sibling;
        while (sibling) {
            if (sibling.matches(selector)) return sibling;
            sibling = sibling.previousElementSibling
        }
    };

}
const loadPositions = (aType) => {
    // Inflight retail used to be separate category of positions, but removed since new procedure is assign to top seller regardless of grade. 
    const A380_3class_ULR = {//On ULR 2 CSV in YC
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["ML5", "UL1A", "ML1"]},
        FG1: {galley: ["MR2A"], main: ["UR1", "UL1"]},
        GR1: {galley: ["ML3A", "MR4A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A"]},
        GR2: {galley: ["ML2", "MR4"], main: ["MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
        CSA: {galley: [], main: ["CSA"]} //sits at ML2A
    };
    const A380_3class_nonULR = { //9 Gr2s on main deck
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["ML5", "UL1A"]},
        FG1: {galley: ["MR2A"], main: ["UL1","UR1"]},
        GR1: {galley: ["ML3A", "MR4A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A"]},
        GR2: {galley: ["ML2", "MR4"], main: ["ML1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
        CSA: {galley: [], main: ["CSA"]} //sits at ML2A
    };
    const A380_4class_nonULR = { 
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["ML5", "UL1A", "ML1"]},
        FG1: {galley: ["MR2A"], main: ["UL1","UR1"]},
        GR1: {galley: ["ML3A", "MR4A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A", "ML4A"]},
        GR2: {galley: ["ML2", "MR4", "MR3A"], main: ["MR5", "ML3", "ML4", "MR3", "MR2", "MR1"]},
        CSA: {galley: [], main: ["CSA"]} //sits at ML2A
    };
    const A380_4class_ULR = A380_4class_nonULR;
    const A380_2class_ULR = {//On ULR 2 CSV in YC
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["ML5", "UL1A", "ML1"]},
        FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculation outOfGrade()
        GR1: {galley: ["ML3A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A"]},
        GR2: {galley: ["UC1", "ML2", "MR4"], main: ["UR1", "UL1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
        CSA: {galley: [], main: []}
    };
    const A380_2class_nonULR = {//9 Gr2s on main deck
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["ML5", "ML1", "UL1A"]},
        FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculation outOfGrade()
        GR1: {galley: ["ML3A"], main: ["UL2", "UR2", "UL3", "UR3", "UR1A"]},
        GR2: {galley: ["UC1", "ML2", "MR4"], main: ["UR1", "UL1", "MR1", "MR5", "ML3", "ML4", "MR3", "MR2"]},
        CSA: {galley: [], main: []} 
    };
    const B773_2class_ULR = {
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["L5"]},
        FG1: {galley: [], main: []},//empty field required so this grade is not skipped when calculation outOfGrade()
        GR1: {galley: ["L1A"], main: ["L1", "R1"]}, // L1A seated at R1A
        GR2: {galley: ["R5", "L3"], main: ["L2", "L4", "R4", "R3", "R2", "L5A"]},
        CSA: {galley: [], main: []}
    };
    const B773_2class_nonULR = B773_2class_ULR;
    const B773_3class_ULR = {
        PUR: {galley: [], main: ["PUR"]},
        CSV: {galley: [], main: ["L5", "R2A"]},
        FG1: {galley: ["L1"], main: ["R1"]},
        GR1: {galley: ["L2A"], main: ["L2", "R2"]},
        GR2: {galley: ["R5", "L3"], main: ["L4", "R4", "R3", "L5A"]},
        CSA: {galley: [], main: []} 
    };
    const B773_3class_nonULR = B773_3class_ULR;
    const B772_2class_ULR = {
        PUR: {galley: [],main: ["PUR"]},
        CSV: {galley: [],main: ["L4", "R1A"]},
        FG1: {galley: [], main: []},
        GR1: {galley: ["L1A"], main: ["L1", "R1"]}, //L1A seated at L4C
        GR2: {galley: ["R4", "L3"], main: ["L2", "R2", "R3", "L4A"]},
        CSA: {galley: [], main: []} 
    };
    const B772_2class_nonULR = B772_2class_ULR;
    return { ...eval(aType) };//positions cloned from constants
}
function checkVCM (positions, crewList) {
        let positionsList = [];
        Object.keys(positions).forEach((grade)=>{//Iterate through each grade and group and push positions to an array 
            Object.keys(positions[grade]).forEach((group)=>{
                positions[grade][group].forEach((item)=>{positionsList.push(item)})
            });//end forEach(group)
        })//end forEach(grade)
        return positionsList.length - crewList.length;
}
//Next functions handle non-standard operation rules
function extraRules(VCM, positions){
    //For rare case, when operating with additional crew. This happens when for example 3 class crew set on return sector operates 2 class aircraft
    const EXTRA = {
        A380_3class_ULR: ["MR3A"],
        A380_3class_nonULR: ["MR3A", "ML2A"],
        B773_cargo_ULR: ["L3", "L4", "R4", "R3", "L5", "R5", "R5A", "R5C", "L5A"],
        B773_cargo_ETOPS: ["R2", "L3", "L4", "R4", "R3", "L5", "R5", "R5A", "R5C", "L5A"],
        B773_cargo_nonULR: ["L2", "R2", "L3", "L4", "R4", "R3", "L5", "R5", "R5A", "R5C", "L5A"],
        B773_cargoModified_ULR: ["R1", "R2", "L3", "L4", "R4", "R3", "R5A", "R5C", "L5A"], 
        B773_cargoModified_nonULR: ["R1", "R2", "L3", "L4", "R4", "R3", "L5", "R5A", "R5C", "L5A"],
        A380_cargo_cargoInHold: ["MR2", "ML2", "ML2A", "MR2A", "ML3", "MR3", "ML3A", "MR3A", "ML4", "MR4", "ML4A", "MR4A", "ML5", "MR5", "UL1", "UR1", "UR1A", "UL1A", "UL2", "UR2", "UL3", "UR3"]
    }
    EXTRA.A380_2class_nonULR = EXTRA.A380_2class_ULR = ["MR3A", "MR2A", "ML4A", "MR4A", "ML2A"];
    EXTRA.A380_4class_nonULR = EXTRA.A380_4class_ULR = [];
    EXTRA.B773_2class_ULR = EXTRA.B773_2class_nonULR = EXTRA.B773_3class_ULR = EXTRA.B773_3class_nonULR = ["R5A", "R5C"];
    EXTRA.B772_2class_ULR = EXTRA.B772_2class_nonULR = ["R4A", "R4C"];
    for (let f=0; f>VCM; f--){
        positions.GR2.main.push(EXTRA[aircraftType].shift())
    }
}
function VCMrules (VCM, positions, positionsDF, positionsW){
    //Crew positions adjustment
    switch(aircraftType) {
        //===========================================================================
        case "A380_3class_ULR":
        case "A380_3class_nonULR":
            if (VCM >= 1){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML4"),1)
                positions.GR1.main.splice(positions.GR1.main.indexOf("ML4A"),1)
                positions.GR1.main.push("ML4 (ML4A)")
                positionsDF.A380[3].GR1 = "ML4 (ML4A)"
            }
            if (VCM >= 2){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR5"),1)
                positions.GR1.main.splice(positions.GR1.main.indexOf("MR4A"),1)
                positions.GR1.main.push("MR5 (MR4A)")
                delete positionsDF.A380[3].GR2
            }
            if (VCM >= 3){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML3"),1)
                positions.GR1.galley.splice(positions.GR1.main.indexOf("ML3A"),1)
                positions.GR1.galley.push("ML3 (ML3A)")
            }
            if (VCM >= 4 && aircraftType === "A380_3class_ULR"){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("ML1"),1)
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR1"),1)
                positions.PUR.main.push("ML1 (PUR)")
                positions.CSV.main.push("MR1 (ML1)")
            }
            if (VCM >= 4 && aircraftType === "A380_3class_nonULR"){ 
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML1"),1)
                positions.PUR.main.push("ML1 (PUR)")
            }
            if (VCM >= 5){
                errorHandler("Less than minimum crew requirement to operate", "red")
            }
        break;
        //===========================================================================
        case "A380_4class_ULR":
        case "A380_4class_nonULR":
            if (VCM >= 1){ 
                positions.GR2.galley.splice(positions.GR2.galley.indexOf("MR3A"),1)
                positionsW.GR2.shift()
                positionsW.GR2.push("MR2 (MR3AA)")
            }
            if (VCM >= 2){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML4"),1)
                positions.GR1.main.splice(positions.GR1.main.indexOf("ML4A"),1)
                positions.GR1.main.push("ML4 (ML4A)")
                positionsDF.A380[4].GR1 = "ML4 (ML4A)"
            }
            if (VCM >= 3){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR5"),1)
                positions.GR1.main.splice(positions.GR1.main.indexOf("MR4A"),1)
                positions.GR1.main.push("MR5 (MR4A)")
                delete positionsDF.A380[4].GR2
            }
            if (VCM >= 4){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML3"),1)
                positions.GR1.galley.splice(positions.GR1.main.indexOf("ML3A"),1)
                positions.GR1.galley.push("ML3 (ML3A)")
            }
            if (VCM >= 5){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("ML1"),1)
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR1"),1)
                positions.PUR.main.push("ML1 (PUR)")
                positions.CSV.main.push("MR1 (ML1)")
            }
            if (VCM >= 6){
                errorHandler("Less than minimum crew requirement to operate", "red")
            }
        break;
        //===========================================================================
        case "A380_2class_ULR":
        case "A380_2class_nonULR":
            if (VCM >= 1){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML3"),1)
                positions.GR1.galley.splice(positions.GR1.main.indexOf("ML3A"),1)
                positions.GR1.galley.push("ML3 (ML3A)")
            }
            if (VCM >= 2 && aircraftType === "A380_3class_ULR"){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("ML1"),1)
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("MR1"),1)
                positions.PUR.main.push("ML1 (PUR)")
                positions.CSV.main.push("MR1 (ML1)")
            }
            if (VCM >= 2 && aircraftType === "A380_3class_nonULR"){ 
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1)
                positions.GR2.main.splice(positions.GR2.main.indexOf("ML1"),1)
                positions.PUR.main.push("ML1 (PUR)")
            }
            if (VCM >= 3){
                errorHandler("Less than minimum crew requirement to operate", "red")
            }
        break;
        //===========================================================================
        case "B773_2class_ULR":
        case "B773_2class_nonULR":
            if (VCM >= 1){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("L5A"),1);
            }
            if (VCM >= 2){ 
                positions.GR1.galley.splice(positions.GR1.main.indexOf("L1A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R2"),1);
                positions.GR1.galley.push("R2 (L1A)");
            }
            if (VCM >= 3){ 
                positions.GR1.main.splice(positions.GR1.main.indexOf("L1"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("L2"),1);
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1);
                positions.GR1.main.push("L2 (L1)");
                positions.PUR.main.push("L1 (PUR)");
            }
            if (VCM >= 4){
                errorHandler("Less than minimum crew requirement to operate", "red")
            }
        break;
        //===========================================================================
        case "B773_3class_ULR":
        case "B773_3class_nonULR":
            if (VCM >= 1){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("L5A"),1);
            }
            if (VCM >= 2){ 
                positions.GR1.galley.splice(positions.GR1.main.indexOf("L2A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("L4"),1);
                positions.GR1.galley.push("L4 (L2A)");
            }
            if (VCM >= 3){ 
                positions.CSV.main.splice(positions.CSV.main.indexOf("R2A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R4"),1);
                positions.CSV.main.push("R4 (R2A)");
            }
            if (VCM >= 4){ 
                positions.FG1.main.splice(positions.FG1.main.indexOf("L1"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R5"),1);
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1);
                positions.FG1.main.push("R5 (L1)");
                positions.PUR.main.push("L1 (PUR)");
            }
            if (VCM >= 5){
                errorHandler("Less than minimum crew requirement to operate", "red")
            }
        break;
        //===========================================================================
        case "B772_2class_ULR":
        case "B772_2class_nonULR":
            if (VCM >= 1){ 
                positions.GR2.main.splice(positions.GR2.main.indexOf("L4A"),1);
            }
            if (VCM >= 2){ 
                positions.GR1.main.splice(positions.GR1.main.indexOf("R1A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R2"),1);
                positions.GR1.main.push("R2 (R1A)");
            }
            if (VCM >= 3){ 
                positions.GR1.galley.splice(positions.GR1.main.indexOf("L1A"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("L2"),1);
                positions.GR1.galley.push("L2 (L1A)");
            }
            if (VCM >= 4){ 
                positions.GR1.main.splice(positions.GR1.main.indexOf("L1"),1);
                positions.GR2.main.splice(positions.GR2.main.indexOf("R4"),1);
                positions.PUR.main.splice(positions.PUR.main.indexOf("PUR"),1);
                positions.GR1.main.push("R4 (L1)");
                positions.PUR.main.push("L1 (PUR)");
            }
            if (VCM >= 5){
                errorHandler("Less than minimum crew requirement to operate", "red")
            }
        break;
        default:
            errorHandler("Aircraft type not found!", "red")
    }//end switch
}
function checkOutOfGrade (positions, crewList){
    let outOfGradeDiff = {};
    Object.keys(positions).forEach((grade)=>{
        let positionsList = [];
        Object.keys(positions[grade]).forEach((group)=>{
            positions[grade][group].forEach((item)=>{positionsList.push(item)})
        });//End forEach(group)
        const filterCrew = crewList.filter( x => x.grade === grade);
        let u = filterCrew.length - positionsList.length;
        if (u){outOfGradeDiff[grade] = u}
    })//End forEach(grade)
    return outOfGradeDiff;
}
function outOfGradeRules (outOfGrade, crewList){
    const grades = {"PUR": 5, "CSV":4, "FG1": 3, "GR1":2,"GR2": 1, "CSA":0}; //Used to manipulate grades as numbers. Since crew can operate only 1 grade higher or 2 grades lower
    do{
        let oldGrade = Object.keys(outOfGrade).find(key => outOfGrade[key] > 0);
        let newGrade = Object.keys(outOfGrade).find(key => outOfGrade[key] < 0);
        if (grades[oldGrade] - grades[newGrade] <= 2 
            && grades[oldGrade] - grades[newGrade] > 0){ // Crew pulled as lower grade
            const filterCrew = crewList.filter( x => x.grade === oldGrade);
            filterCrew.sort((a, b) => a.timeInGradeNumber - b.timeInGradeNumber); //most junior crew
            filterCrew[0].grade= newGrade; //moves crew to a new grade
            errorHandler(`Crew ${filterCrew[0].nickname} grade changed`, "yellow");
            filterCrew[0].originalGrade= oldGrade; 
            filterCrew[0].count = filterCrew[0].count + (grades[oldGrade] - grades[newGrade])*100;
        }
        else if (grades[oldGrade] - grades[newGrade] >= -1 
            && grades[oldGrade] - grades[newGrade] < 0){ // Crew pulled as higher grade
            const filterCrew = crewList.filter( x => x.grade === oldGrade);
            filterCrew.sort((a, b) => b.timeInGradeNumber - a.timeInGradeNumber); //most senior crew
            filterCrew[0].grade= newGrade; 
            errorHandler(`Crew ${filterCrew[0].nickname} grade changed`, "yellow");
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
            errorHandler(`Crew ${filterCrew[0].nickname} grade changed`, "yellow");
            filterCrew[0].originalGrade= oldGrade; 
            filterCrew[0].count = filterCrew[0].count + (grades[oldGrade] - grades[middleGrade])*100;
            //second crew
            const filterMiddleCrew = crewList.filter( x => x.grade === middleGrade);
            filterMiddleCrew.sort((a, b) => a.timeInGradeNumber - b.timeInGradeNumber);
            filterMiddleCrew[0].grade= newGrade; 
            errorHandler(`Crew ${filterMiddleCrew[0].nickname} grade changed`, "yellow");
            filterMiddleCrew[0].originalGrade= middleGrade; 
            filterMiddleCrew[0].count = filterMiddleCrew[0].count + (grades[middleGrade] - grades[newGrade])*100;
        }
        //Need to add rare condition, when high grade missing and low grade pulled out
        //For example, need Fg1 and pulled Gr2 so all grades need to move up 1 person till filled
        outOfGrade[oldGrade] --;
        outOfGrade[newGrade] ++;
    } while (Object.values(outOfGrade).reduce((a, b) => a + Math.abs(b)) !== 0)
}
//Positions, W, IR and breaks generators   
function selectW (crewList, positions, sectors, positionsW){//Pre-allocates positions for premium economy crew
    //Check if enough W crew. If not - add most senior crew to W list
    Object.keys(positionsW).forEach((grade)=>{
        if (grade.length > crewList.filter( x => x.qualifiedW && x.grade == grade).length){
            let availableCrew = crewList.filter( x => x.qualifiedW == false && x.grade == grade)
            availableCrew.sort((a, b) => a.timeInGrade - b.timeInGrade);
            for (let i = positionsW[grade].length - crewList.filter( x => x.qualifiedW && x.grade == grade).length; i>0; i--){
                crewList.find(y = y.staffNumber == availableCrew[0].staffNumber).operatingW = true;
                availableCrew.shift();
            }//end for
        }//end if
    }) //end forEach
    for (let s=1; s<=sectors; s++){
        Object.keys(positionsW).forEach((grade)=>{
            positionsW[grade].forEach((position)=>{
                let crewWW = crewList.filter(x => x.grade === grade && x.operatingW && !x.lastPosition.every(v => positionsW[grade].includes(v)) && (x[`position${s}`] == "" || !x.hasOwnProperty(`position${s}`)));
                if (!crewWW.length){
                    crewWW = crewList.filter(x => x.grade === grade && x.operatingW && !x.hasOwnProperty(`position${s}`));
                }
                allocate(crewWW, position, s)
            })})//End of both forEach
    }//end for
    positions.CSV.main.pop();
    // positions.GR2.main.pop(); //commented temporarly as rule changed to give W positions to a mix of crew
    positions.GR2.galley.pop();
}
function selectIR (crewList, positions, sectors, positionsDF){//Sets value true for key inflightRetail
    const filterCrew = crewList.filter( x => x.ratingIR < 21 && x.grade !== "CSV");
    if (filterCrew.length){
        filterCrew.sort((a, b) => a.ratingIR - b.ratingIR);
        let pre_x = aircraftType.includes('A380') ? 2 : 1;
        let x = filterCrew.length >= pre_x ? pre_x : 1;
        if (x != pre_x) errorHandler("Not enough IR rating crew", "red");
        for (let i=0; i<x; i++){
            filterCrew[i].inflightRetail = true;
            DFgrade = filterCrew[i].grade;
            if (positionsDF[plane][classes][DFgrade] && !filterCrew[i].operatingW){
                for (let s=1; s<=sectors; s++){
                        filterCrew[i][`position${s}`]=positionsDF[plane][classes][DFgrade];
                };
                positions[DFgrade].main.splice(positions[DFgrade].main.indexOf(positionsDF[plane][classes][DFgrade]), 1);
                delete positionsDF[plane][classes][DFgrade];
            } else if (positionsDF[plane][classes][DFgrade] && !filterCrew[i].operatingW) {
                errorHandler("W and IR conflict", "yellow")
            }
        };
    }
    else {
        errorHandler("No IR rating crew", "red")
    }
}
function selectPositions (s, positions, crewList){
    let positionsActive = {...positions}
    Object.keys(positionsActive).forEach((grade)=>{
        Object.keys(positionsActive[grade]).forEach((type)=>{
            if (positionsActive[grade][type].length!==0){
                if (type === "galley"){
                    positionsActive[grade][type].forEach((position)=>{
                        let filteredCrew = crewList.filter( x => 
                            x.grade === grade && 
                            x.timeInGradeNumber > 6 && 
                            !x[`position${s}`] && 
                            !x.inflightRetail); //to not give galley position to IR operator
                        if (!filteredCrew.length)
                            {filteredCrew = crewList.filter( x => 
                            x.grade === grade && 
                            !x[`position${s}`] && 
                            !x.inflightRetail);}
                        const filteredCrewLast = filteredCrew.filter( p => 
                            !p.lastPosition.includes(position));
                        if (filteredCrewLast.length > 0){filteredCrew = filteredCrewLast};
                        allocate(filteredCrew, position, s)
                        })//end forEach(position)
                }
                else {//non-galley positions ("main")
                    positionsActive[grade][type].forEach((position)=>{
                        if (position === "CSA"){
                            const filteredCrew = crewList.filter( x => 
                                x.grade === grade && 
                                !x[`position${s}`]);
                            allocate(filteredCrew, position, s)
                        }
                        else if(position === "UR1A"){//to not give UR1A to IR operator
                            const filteredCrew = crewList.filter( x => 
                                x.grade === grade && 
                                !x[`position${s}`] && 
                                !x.inflightRetail);
                                allocate(filteredCrew, position, s)
                        }
                        else{//non-CSA positions
                            let filteredCrew = crewList.filter( x => 
                                x.grade === grade && 
                                !x[`position${s}`] && 
                                !x.lastPosition.includes(position));
                            if (!filteredCrew.length){ //No solution. Ignore last position
                                filteredCrew = crewList.filter( x => 
                                    x.grade === grade && 
                                    !x[`position${s}`]);
                            }//end if length 0
                            allocate(filteredCrew, position, s)
                        }//end else non-CSA
                    })//end forEach(position) 
                }//end else non-galley
            }//end if position type empty
        })//end forEach(type)
    })//end forEach((grade)
}
function allocate (filteredCrew, position, s){
    let w = filteredCrew.length;
    let q = getRandomNumber(0, w-1);    
    filteredCrew[q][`position${s}`] = position; 
    // console.log(filteredCrew[q].nickname, "  =>  ", position)
    filteredCrew[q].lastPosition.push(position); 
    filteredCrew[q].lastPosition.shift()
}
const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
//Position handlers for cargo flights simplified since crew work out of grades, no galleys and inflight retail
function selectPositionsCargo () {
    positions.forEach((h, index) => {
        crewList[index].position1=h
    })
}
function loadPositionsCargo (aType){
    const B773_cargoModified_nonULR = ["L1", "L2", "R5"];
    const B773_cargoModified_ULR = ["L1", "L2", "R5", "L5"];
    const B773_cargo_nonULR = ["L1", "R1"];
    const B773_cargo_ETOPS = ["L1", "R1", "L2"];
    const B773_cargo_ULR = ["L1", "R1", "L2", "R2"];
    const A380_cargo_cargoInHold = ["MR1", "ML1"];
    return [ ...eval(aType) ];
}
//Renderer draws tablet with crew details and allocated positions
function createOutput (numberOfSectors, hasBreaks, crewList) {
    crewList.sort((a, b) => a.count - b.count);
    let headerInsert = "";
    for (let i=1;i<=numberOfSectors;i++){
        headerInsert += `<th>Position ${i}</th>`
        if (hasBreaks){
            headerInsert += `<th>Break ${i}</th>`
        } //end if
    } //end for
    const header = `
        <table border="1">  
            <tr>
                <th>Grade</th>
                <th>Nickname</th>
                ${headerInsert}
                <th>Full name</th>
                <th>Staff number</th>
                <th>Nationality</th>
                <th>Languages</th>
                <th>Time in grade</th>
                <th>Badges</th>
                <th>Comment</th>
            </tr>`;
    const footer = `</table> <br/> <span> * Positions will be adjusted to accommodate MFP 2.0 requirements </span>`;            let fileContent = "";
    let lastGrade = ""; 
    crewList.forEach(createTable); 
        function createTable(item, index) {
            if(!aircraftType.includes("cargo"))
            {if (lastGrade == "") {
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
                if (item.inflightRetail){item["position"+s] += " (IR)"};
                fileContentInsert+=`<td><div contenteditable>${item["position"+s]}</div></td>`;
        
                    if (hasBreaks){
                        fileContentInsert+=`<td><div contenteditable>${item["break"+s]}</div></td>`;
                    }//end if
            }//end for
            let badges ="";
            item.ratingIR<=20? badges+= `<span class="badge badge-ir">${item.ratingIR}</span>`:"";
            item.qualifiedW?badges+=`<span class="badge badge-w">W</span>`:"";
            fileContent += `<tr><td class="centerCell">${item.grade} ${item.originalGrade?"("+item.originalGrade+")":""}</td><td>${item.nickname}</td>${fileContentInsert}<td>${item.fullname}</td><td class="centerCell">${item.staffNumber}</td><td><img src="${item.flag}"/>  ${item.nationality}</td><td>${item.languages}</td><td class="centerCell">${item.timeInGrade}</td><td class="centerCell">${badges}</td><td>${item.comment}</td></tr>`;
            lastGrade = item.grade;
        }//end createTable()
    let g = header + fileContent + footer;
    document.querySelector("#output").innerHTML = g;
}

// Breaks allocation
function selectBreaks (crewList, numberOfSectors, VCM) {
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
    if(VCM){
        let h = crc === -1 ? breaks[plane][op2.value]["HBS"][classes]["GR2"] : breaks[plane][op2.value][crc === 1? "CRC" : crc === 2? "LD" : "MD"]["GR2"];
        for(let y=1; y<VCM; y++){
            h.pop();
        }
        errorHandler("Breaks adjusted for VCM", "green")
    }
    if (classes==4){breaks.A380.LD.GR2 = [1,2,1,2,1,2,1,2]} // Adjustment for 4 class A380
    let f = [];
    // I don't like next line of code, but there was no other way to clone deep nested object (spread operator or Object.assign() led to shallow copy of the original object. I also did not want to use side libraries like lodash for this task)
    for (let z = 1; z<=numberOfSectors; z++){//Idex 0 of this array will be empty value for clarity in sector numbers
        f[z] = JSON.parse(JSON.stringify(crc === -1 ? breaks[plane][op2.value]["HBS"][classes] :
        breaks[plane][op2.value][crc === 1? "CRC" : crc === 2? "LD" : "MD"]))
    }
    crewList.forEach(crew => {
        for (let s = 1; s<=numberOfSectors; s++){
            if(crew.grade ==="PUR" || crew.grade === "CSV" || crew.grade === "CSA"){ //For positions with specific break in crew rest strategy
                crew[`break${s}`]=f[s][crew[`position${s}`]]
            }
            else {
                let filteredBreaks = f[s][crew.grade].filter (e => e !== crew[`break${s-1}`]);
                if(!filteredBreaks.length){filteredBreaks = f[s][crew.grade]};
                crew[`break${s}`]=filteredBreaks[getRandomNumber(0,filteredBreaks.length-1)];
                f[s][crew.grade].splice(f[s][crew.grade].indexOf(crew[`break${s}`]), 1);
            }
        }
    })//end forEach(crew)
}
//Select aircraft type
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
    //Aircraft types for breaks calculation according to registration number
    const fleet = {
        //B777
        FHS: {reg: ['QH', 'QI','QJ', 'QK','QL', 'QM', 'QN','QO','QP'], description: "B773 Full heigh suits (with CRC)", crc: 1, planeType: "B773", classes: 3}, 
        CRC: {reg: ['BQ','BR', 'BU', 'BW', 'BY', 'CA', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ','CK','CM','CN','CO','CP','CQ','CR','CS','CT','CU','CV','CW','CX','GA','GB','GC','GE','GF','GH','GI'], description: "B773 3 class (with CRC)", crc: 1, planeType: "B773", classes: 3}, 
        FS3: {reg: ['PV','PW','PX','PY','PZ','QA','QB','QC','QD','QE','QF','QG'], description: "B773 3 class Falcon seats (with CRC)", crc: 1, planeType: "B773", classes: 3}, 
        FS2: {reg: ['WA', 'WB','WC','WD','WE','WF','WG','WH','WI','WJ'], description: "B772 2 class Falcon seats (with CRC)", crc: 1, planeType: "B772", classes: 2}, 
        CMC: {reg: ['BJ','BK','BM','BN','BO','GD','GG','GK','GP','GT','GU','GW'], description: "B773 Cargo modified cabin", crc: -1, planeType: "B773", classes: 0}, 
        HB2: {reg: ['CY','CZ','NA','NB','NC','ND','NF','NH','NI','NO','NW','NY','PE','PG','PQ','PR','PT'], description: "B773 2 class (Hard blocked seats)", crc: -1, planeType: "B773", classes: 2}, 
        HB3: {reg: ['GJ','GL','GM','GN','GO','GQ','GR','GS','GV','GX','GY','GZ','NE','NG','NJ','NK','NL','NM','NN','NP','NQ','NR','NS','NT','NU','NV','NX','NZ','PA','PB','PC','PD','PF','PH','PI','PJ','PK','PL','PM','PN','PO','PP','PS','PU'], description: "B773 3 class (Hard blocked seats)", crc: -1, planeType: "B773", classes: 3},
        //A380 
        ANC: {reg: [/*517 seats*/ 'DF', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DL', 'DQ', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX', 'EA', 'EB', 'EC', 'ED', 'EE', 'EI', 'EJ', 'EN', 'ER', 'ES', /*519 seats*/ 'EW', 'EX', 'EY', 'EZ', 'OA', 'OB', 'OI','OJ', 'OK','OO','OT','OU','OV','OW','OZ','UA','UB','UC','UD','UM'], description: "A380 3 class (no CRC)", crc: -1, planeType: "A380", classes: 3}, 
        A2C: {reg: ['OP','OQ','OR','OS','OX','OY','UN','UO','UP','UQ','UX','UY','UZ','VA','VB'], description: "A380 2 class (no CRC)", crc: -1, planeType: "A380", classes: 2}, 
        AMD: {reg: [/*489 seats*/ 'DA','DC','DD','DE','DM','DN','DO','DP','DY','DZ','EF','EG','EH','EK','EL','EM','EO','EP','EQ','ET', /*491 seats */ 'EU','EV','OC','OD','OE','OF','OG','OH','OL','OM','ON'], description: "A380 3 class (Main deck CRC)", crc: 3, planeType: "A380", classes:3}, 
        ALD: {reg: ['UE', 'UF', 'UG', 'UH', 'UI', 'UJ', 'UK', 'UL', 'UR', 'US', 'UT', 'UU'], description: "A380 3 class (Lower deck CRC)", crc: 2, planeType: "A380", classes: 3}, 
        A4C: {reg: ['VN', 'VO', 'VP', 'VQ', 'VR','VS'], description: "A380 4 class (Lower deck CRC)", crc: 2, planeType: "A380", classes: 4}, 
        ANL: {reg: ['UV', 'UW', 'VC', 'VD', 'VE', 'VF', 'VG', 'VH', 'VI', 'VJ', 'VK', 'VL', 'VM'], description: "A380 3 class New lounge (Lower deck CRC)", crc: 2, planeType: "A380", classes:3}
    }
    let desc = document.querySelector("#description");
    let hasMatch = false;
    if(input.length == 2){
        Object.keys(fleet).forEach((type)=>{
            if(fleet[type].reg.includes(input.toUpperCase())){
                desc.innerHTML = `<span class="warn warn-green">${fleet[type].description}</span>`;
                hasMatch = true;
                plane=fleet[type].planeType;
                classes = fleet[type].classes;
                crc = fleet[type].crc; // CRC parameters: -1 -> no crc, 1 -> crc, 2 -> A380 LD CRC, 3 -> A380 MD CRC
                // return {aircraftType, }
            }
        })
        if (!hasMatch){desc.innerHTML = `<span class="warn warn-red">No such registration</span>`}
    }
    else {desc.innerHTML = `<Full class="warn warn-yellow">Full registration required</span>`}
    adjustSelection();
    clearErrors();
}

//HTML related secondary functions
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
    aircraftType = `${plane}_${op1.value === "pax" ? classes+"class": (classes === 0? "cargoModified" : "cargo" )}_${op2.value}`;
}
function hideShowSettings (){
    document.getElementById("settings").classList.toggle("hidden")
}
const dataStats = (input) => {
    document.getElementById('dataLength').innerHTML = input.length;
    clearErrors();
}
function errorHandler (message, color) {
    color == "green" ? console.log(message):color == "yellow"?console.warn(message):console.error(message);
    let field = document.querySelector("#errors");
    field.innerHTML += `<div class="warn warn-${color}">${message}<div>`
}
function clearErrors () {
    let field = document.querySelector("#errors");
    field.innerHTML = ``;
    document.querySelector("#output").innerHTML = ``
}