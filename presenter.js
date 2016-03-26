// PRESENTATION is the class that wraps different content and decides what to show
//========================================
//
function Presentation(){
    // The pointer is set to the id of the 
    // songcontent object currently set as active
    this.pointer = undefined;
    // This might be unnecessary:
    this.currentcontent = undefined;
    this.SetActiveContent = function(oid){
        this.pointer = oid;
        return 0;
    };
    //Move in the presentation
    this.Forward = function(){};
    this.Backwards = function(){};
}

// Screencontent is the class that contains the actual data to be shown
//========================================

function ScreenContent(){
    this.custombg="";
    this.id = CreateUid();
    //The pointer property is important. It Tells which screenfull to show
    this.pointer = 0;
    // Screenfull here means the content blocks divided into 
    // parts that will be shown at the time
    this.screenfulls = [];
    this.Show = 
        function(){
            //Print the content of this object to screen
            //IF this is set as the active content object
            //by the presentetion.pointer property.
            if(pres.pointer==this.id){
                screen1.innerText = this.screenfulls[this.pointer];
            }
        };
}

// Songcontent
//------------------------------

function SongContent(title, songtexts){
    this.title = title;
    this.songtexts = songtexts;
    this.screenfulls = 
        function(content){
            // split the song content to an array consisting of verses;
            // This is a bit hacky: removing empty lines
            // Should rather improve the regex!
                arr1 = content.split(/(^\s*$\n)+/m);
                for (var i = 0;i<arr1.length;i++){
                    if (arr1[i] === "" || arr1[i].search(/^\s+$/g) != -1){
                        arr1.splice(i,1);
                    }
                }
                return arr1;
            }(this.songtexts);
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
//Fetch the songs
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

function CreateUid(){
//Unique id generator
//Creates a universal unique identifier to be used in making each 
//credits go to  bufa @ http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
//
    var newuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    return newuid;
}

//The Global screen variables poin to the places on the
//screen, where content is shown to the audience
var screen1 = document.getElementById("screen1");
//Two more global objects: all the songs and the actual presentation to run
var allsongs = GetSongs();
var pres = new Presentation();



//
//
//document.getElementById("test").innerText = songdivs[0].innerText;
