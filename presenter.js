// PRESENTATION is the class that wraps different content and decides what to show
//========================================
//
function Presentation(){
    // The pointer is set to the id of the 
    // songcontent object currently set as active
    this.pointer = undefined;
    this.contents = [];
    // This might be unnecessary:
    this.currentcontent = undefined;
    //Setting the pointer
    this.SetActiveContent = function(oid){
        this.pointer = oid;
        return 0;
    };

    //Move in the presentation
    //..............................


    this.Forward = function(){
        var started = true;
        if (this.pointer === undefined){
            //If the presentation has not yet started
            //Set the pointer to zero
            this.pointer = 0;
            started = false;
        }
        var currentcontent = this.contents[this.pointer]

        //Try to increment inner pointer of the current screencontent 
        if(currentcontent.screenfulls.length - 1>currentcontent.pointer && started){
            //if there are still screenfulls to be shown in this content object
            //AND if this is not the first content of the presentation
            currentcontent.pointer++;
        }
        else if (started){
            //If the previous content has reached its end
            //Move to the next one IF THERE IS such a thing
            if (this.contents.length - 1 >this.pointer){
                this.pointer++;
                currentcontent = this.contents[this.pointer]
            }
        }
        currentcontent.Show();
    };

    this.Backwards = function(){
        if (this.pointer === undefined){
            //If the presentation has not started yet, stop the function
            return false;
        }
        var currentcontent = this.contents[this.pointer]

        //Try to increment inner pointer of the current screencontent 
        if(currentcontent.pointer>0){
            //if there are still screenfulls to be shown in this content object
            //AND if this is not the first content of the presentation
            currentcontent.pointer--;
        }
        else{
            //If the content has reached its beginning
            //Move to the previous one IF THERE IS such a thing
            if (this.pointer>0){
                this.pointer--;
                currentcontent = this.contents[this.pointer]
            }
        }
        currentcontent.Show();
    };

    // Other methods
    //..............................

    this.GetStructure= function (){
        //If there is a predefined structure for the presantation
        //this function extracts it
        structure = document.getElementById("structure");
        for (var i=0;i<structure.childNodes.length;i++){
            if (structure.childNodes[i].nodeName!=="#text"){
                //If the structure div contains tags
                if (structure.childNodes[i].tagName=="SONG"){
                    var role = structure.childNodes[i].getAttribute("role");
                    //ADD [here] a test for seeing whether allsongs actually contains something by this name
                    //...
                    // If the type of content was a song, add it to the
                    // presentation from the allsongs global variable
                    this.contents[this.contents.length] = allsongs[structure.childNodes[i].innerText];
                }
                else{
                    this.contents[this.contents.length] = structure.childNodes[i];
                }
            }
        }
        return 0;
    };

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
            screen1.innerText = this.screenfulls[this.pointer];
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

//The Global screen variables point to the places on the
//screen, where content is shown to the audience
var screen1 = document.getElementById("screen1");
//Two more global objects: all the songs and the actual presentation to run
var allsongs = GetSongs();
var pres = new Presentation();
//Fetch a predefined structure
pres.GetStructure();



//
//
//document.getElementById("test").innerText = songdivs[0].innerText;
