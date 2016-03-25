// PRESENTATION is the class that wraps different content and decides what to show
//========================================
//
function Presentation(){
    this.pointer = 0;
    this.currentcontent = undefined;
}

// Screencontent is the class that contains the actual data to be shown
//========================================

function ScreenContent(){
    this.custombg="";
    //The pointer property is important. It Tells which screenfull to show
    this.pointer = 0;
    // Screenfull here means the content blocks divided into 
    // parts that will be shown at the time
    this.screenfulls = [];
    this.Show = 
        function(){
        
            console.log('Moro');
        
        };
}

// Songcontent
//------------------------------

function SongContent(title, songtexts){
    this.title = title;
    this.songtexts = songtexts;
    this.screenfulls = this.songtexts.split(/(^\s*$)+/m);
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
//
function GetSongs(){
    var AllSongs = new SongData();

    var songdivs = document.getElementsByClassName("songdata");
    for(var i=0;i<songdivs.length;i++){
        // Add a new songcontent object to the Allsongs container object

        content = songdivs[i].getElementsByClassName("songdatacontent")[0].innerText;
        title = songdivs[i].getElementsByClassName("songtitle")[0].innerText;
        AllSongs[songdivs[i].id] = new SongContent(title, content);
    }

    return AllSongs;
}



//The Global screen variables poin to the places on the
//screen, where content is shown to the audience
var screen1 = document.getElementById("test1");

//RUN THE PROGRAM
//========================================
AllSongs = GetSongs();
Pres = new Presentation();


//
//
//document.getElementById("test").innerText = songdivs[0].innerText;
