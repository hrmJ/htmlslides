//Create prototypes
function Presentation(){
    this.pointer = 0;
}

function ScreenContent(){
    this.custombg="";
    this.pointer = 0;
}

function SongContent(title, songtexts){
    this.title = title;
    this.songtexts = songtexts;
}

//Take care of inheritance

SongContent.prototype = new ScreenContent();
SongContent.prototype.constructor = SongContent;


function BibleContent(){
}

function InfoContent(){
}

function Service(){
    this.name = "Majakkamessu";
}
//This is a container for all the actual song objects
function SongData(){
}



//########################################
//
//Fetch songs
//function GetSongs(){

var AllSongs = new SongData();

var songdivs = document.getElementsByClassName("songdata");
for(var i=0;i<songdivs.length;i++){
    // Add a new songcontent object to the Allsongs container object
    AllSongs[songdivs[i].id] = new SongContent(songdivs[i].id, songdivs[i].innerText);
}

//document.getElementById("test").innerText = songdivs[0].innerText;

//}
