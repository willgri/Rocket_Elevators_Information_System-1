//keeps track of which types are selected
var BUILDING_TYPE;
var ELEVATOR_TYPE;
//refers to the main HTML elements representing the above types
var SELECTED_BUILDING_ELEMENT;
var SELECTED_ELEV_ELEMENT;

var CALCULATED_SHAFTS;
var CALCULATED_PRICE;
var PRICE_PER_UNIT;
var INSTALLATION_FEE;

var FIELD_LABELS;
var ERROR_LABELS;
var INPUT_FIELDS;

//live 
const NODE_URL ='https://ancient-refuge-75808.herokuapp.com/';

//development
//const NODE_URL = 'http://localhost:8000';


/* Quote form

Follows the steps of:
-selecting building type 
-then we activate/display only the fields required for that building type
-once the required values are filled, send a request to the node.js server to calculate the shafts
-if price range is selected, if inputs are valid send a request to calculate the price

-on every input change, we check if element has valid input, if not show error
*/

/* CALLED ON FIELD INPUT */
//if the recent input is invalid, display error, if valid continue to calculation if able
function attemptCalculation(inputName) {

    activate(); //get fresh inputs 

    if (validateThisField(inputName)) {
        //this input is valid, but we don't know about the others yet

        activateFieldName(inputName); //re-activate in case it was previously displaying an invalid input error

        tryToDoMath(); //attempt to calculate, but need to check the other inputs first. 
    } else {
        showError(inputName);
        resetResultsDisplay();
    } 
}

function validateThisField(inputName) {
    var isValidated = true;
    var input = document.getElementById(inputName).value;
    //console.log(input);
    if (isNaN(input) || input < 0) {
        isValidated = false;
    } else {
        //now special case for hours (cant be over 24), it can be non-integer number (ie 12.5 hours is valid)
        if (inputName == 'hoursInput' && input > 24 || inputName == 'hoursInput' && input == 0) {
            isValidated = false;
            //and if its not hours, it must be integer
        } else if (inputName != 'hoursInput' && parseInt(input) != input) {
            isValidated = false;
        }
        //num of floors cant be zero
        if (inputName == 'floorsInput' && input < 1) {
            isValidated = false;
        }
    }
    return isValidated;
}

//iterates through all the required inputs and checks their validity
function tryToDoMath() {
    var success = true;
    for (var i = 0; i < INPUT_FIELDS.length; i++) {

        var thisId = INPUT_FIELDS[i].id;
        if (!validateThisField(thisId)) {
            success = false;
        }
    }
    if (success) {
        //all good, now we can calculate

        //display the loading icon
        showLoader();

        sendForShaftCalculation(); 
    }
}

/* CALLED WHEN BUILDING TYPE IS SELECTED */
function selectBuildingType(selection) {
    BUILDING_TYPE = selection;
    //if a building type is already selected, set it back to default
    //we have to reset the style to default because the button will stay blue if another is pressed and we don't want that.
    if (SELECTED_BUILDING_ELEMENT != null) {
        SELECTED_BUILDING_ELEMENT.style.color = "";
    }
    SELECTED_BUILDING_ELEMENT = getEl(selection);

    //Now set the selected button to solid blue to indicate it's been selected.
    SELECTED_BUILDING_ELEMENT.style.color = "blue";

    activateFields();  //depending on type of building chosen, activate the required fields
}
/* CALLED WHEN PRICE RANGE IS SELECTED */
function chooseType(selection) {
    ELEVATOR_TYPE = selection;
    if (SELECTED_ELEV_ELEMENT != null) {
        SELECTED_ELEV_ELEMENT.style.color = "";
    }
    SELECTED_ELEV_ELEMENT = getEl(selection);
    SELECTED_ELEV_ELEMENT.style.color = "blue";

    //now we attempt to calculate, if all fields are valid
    activate();
    tryToDoMath();
}

function activateFields() {
    //in case the user clicks on another building type, we need to reset all the previouisly activated fields
    resetFieldsToDefault();
    activate();

    enableFields();
}

//used to get all the inputs for any given building type
function activate() {
    switch (BUILDING_TYPE) {
        case 'selection-residential':
            activateResidential();
            break;
        case 'selection-commercial':
            activateCommercial();
            break;
        case 'selection-corporate':
            activateCorporate();
            break;
        case 'selection-hybrid':
            activateHybrid();
    }
}

//Sets up the inputs by getting the appropriate elements
function activateResidential() {
    FIELD_LABELS = document.getElementsByClassName('quote-label-residential');
    INPUT_FIELDS = document.getElementsByClassName('quote-form-residential');
    ERROR_LABELS = document.getElementsByClassName('quote-error-residential');
}
function activateCommercial() {
    FIELD_LABELS = document.getElementsByClassName('quote-label-commercial');
    INPUT_FIELDS = document.getElementsByClassName('quote-form-commercial');
    ERROR_LABELS = document.getElementsByClassName('quote-error-commercial');
}
function activateCorporate() {
    FIELD_LABELS = document.getElementsByClassName('quote-label-corporate');
    INPUT_FIELDS = document.getElementsByClassName('quote-form-corporate');
    ERROR_LABELS = document.getElementsByClassName('quote-error-corporate');
}
function activateHybrid() {
    FIELD_LABELS = document.getElementsByClassName('quote-label-hybrid');
    INPUT_FIELDS = document.getElementsByClassName('quote-form-hybrid');
    ERROR_LABELS = document.getElementsByClassName('quote-error-hybrid');
}


/*****************NODE.JS REQUESTS ************************ */
function sendForShaftCalculation(){
    //make http request to server and receive text to update
    const Http = new XMLHttpRequest();

    Http.open("POST", NODE_URL);

    var toSend;

    switch (BUILDING_TYPE) {
        case 'selection-residential':
            var apts = getEl('appartmentsInput').value;
            var floors = getEl('floorsInput').value;
            toSend = {"calcType": "shafts","building":BUILDING_TYPE, "apts": apts, "floors": floors};
            break;
        case 'selection-commercial':
            var shafts = getEl('cagesInput').value;
            toSend = {"calcType": "shafts","building":BUILDING_TYPE, "shafts": shafts};
            break;
        //the calculations are the same so we can just fall through
        case 'selection-corporate':
        case 'selection-hybrid':
            var occupants = parseInt(getEl('maxOccupantsInput').value);
            var floors = parseInt(getEl('floorsInput').value);
            var basements = parseInt(getEl('basementsInput').value);
            toSend = {"calcType": "shafts","building":BUILDING_TYPE, "occupants": occupants, "floors":floors,"basements":basements};
    }

    Http.send(JSON.stringify(toSend));
    Http.onreadystatechange=()=>{
        //check to make sure the response is ready
        if (Http.readyState === 4 && Http.status === 200)
        {
            //console.log(Http.responseText);
            var jsonResp = JSON.parse(Http.responseText);
    
            CALCULATED_SHAFTS = jsonResp;
            displayCalculatedShafts();
            //we need the number of shafts to calculate the price, so now we have it, we can call for that
            //make sure the selection button is chosen
            if (ELEVATOR_TYPE != null){
                sendForPriceCalculation();
            } else {//no price calc this time, hide the loader. 
                hideLoader();}
            
        }
    }
}
function sendForPriceCalculation(){
    const Http = new XMLHttpRequest();

    Http.open("POST", NODE_URL);

    var toSend = {"calcType": "price", "elevator":ELEVATOR_TYPE, "shafts":CALCULATED_SHAFTS};

    Http.send(JSON.stringify(toSend));

    Http.onreadystatechange=()=>{
        //check to make sure the response is ready
        if (Http.readyState === 4 && Http.status === 200)
        {
            var jsonResp = JSON.parse(Http.responseText);
            
            PRICE_PER_UNIT = jsonResp.unitprice;
            INSTALLATION_FEE = jsonResp.installfee;
            CALCULATED_PRICE = jsonResp.totalprice;
            displayCalculatedPrice();
            hideLoader();
        }
    }
}
/***********************************/



/******************* UI AND FIELD STYLES*************************/

//finds the field with the error and displays it
function showError(inputName) {
    for (var i = 0; i < INPUT_FIELDS.length; i++) {
        if (INPUT_FIELDS[i] == getEl(inputName)) {
            displayFieldError(i);
        }
    }
}
//finds the valid field (or field with its error resolved) and displays it
function activateFieldName(inputName) {
    for (var i = 0; i < INPUT_FIELDS.length; i++) {
        if (INPUT_FIELDS[i] == getEl(inputName)) {
            activateField(i);
        }
    }
}

//stylizees the field when it's input is invalid
function displayFieldError(i) {
    INPUT_FIELDS[i].style.border = "2px solid red";
    ERROR_LABELS[i].style.color = "red";
    ERROR_LABELS[i].style.visibility = "visible";
}
//re-stylizes the field after an error has been resolved
function activateField(i) {
    FIELD_LABELS[i].style.color = "white";
    INPUT_FIELDS[i].style.background = "white";
    INPUT_FIELDS[i].style.border = "2px solid blue";
    ERROR_LABELS[i].style.visibility = "hidden";
}

//enables the required fields to show the user they are active.
function enableFields(){
    for (var i = 0; i < FIELD_LABELS.length; i++) {
        FIELD_LABELS[i].style.color = "white";
    }
    for (var i = 0; i < INPUT_FIELDS.length; i++) {
        INPUT_FIELDS[i].disabled = false;
        INPUT_FIELDS[i].style.background = "white";
        INPUT_FIELDS[i].style.border = "2px solid blue";
    }
}

function displayCalculatedPrice(){
    getEl('resultsString-price').innerHTML = "$" + CALCULATED_PRICE.toFixed(2);
    getEl('resultsString-price').style.color = "darkblue";

    getEl('resultsString-unitprice').innerHTML = "at $" + PRICE_PER_UNIT.toFixed(2) + " per unit";
    getEl('resultsString-installfee').innerHTML =" + " + INSTALLATION_FEE.toFixed(0) + "% installation fee";


}
function displayCalculatedShafts(){
    getEl('resultsString-shafts').innerHTML = CALCULATED_SHAFTS + " shafts";
    getEl('resultsString-shafts').style.color = "darkblue";
}

//once a field is no longer required, it's style is set back to default and it is disabled. 
function resetFieldsToDefault() {
    FIELD_LABELS = document.getElementsByClassName('quote-label');
    for (var i = 0; i < FIELD_LABELS.length; i++) {
        FIELD_LABELS[i].style.color = "";
    }
    INPUT_FIELDS = document.getElementsByClassName('quote-form');
    for (var i = 0; i < INPUT_FIELDS.length; i++) {
        INPUT_FIELDS[i].style.background = "";
        INPUT_FIELDS[i].style.border = "";
        INPUT_FIELDS[i].value = "";

        INPUT_FIELDS[i].disabled = true;
    }
    ERROR_LABELS = document.getElementsByClassName('quote-error');
    for (var i = 0; i < INPUT_FIELDS.length; i++) {
        ERROR_LABELS[i].style = "";
    }
    resetResultsDisplay();
}

function resetResultsDisplay() {
    getEl("resultsString-shafts").style = "";
    getEl("resultsString-shafts").innerHTML = "$ 0.00";
    getEl("resultsString-price").style = "";
    getEl("resultsString-price").innerHTML = "";
    getEl('resultsString-unitprice').innerHTML = "";
    getEl('resultsString-installfee').innerHTML ="";
}

function showLoader(){
    getEl("rocket-loader").style.display ="block";
}
function hideLoader(){
    getEl("rocket-loader").style.display ="none";
}
/* *****************************************/


//Gets the HTML element by its ID
function getEl(elementID) {
    return document.getElementById(elementID);
}
