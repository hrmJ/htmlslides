function Presentation(){
    // PRESENTATION is the class that wraps different content and decides what to show

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
        if(currentcontent.items.length - 1>currentcontent.pointer && started){
            //if there are still items to be shown in this content object
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
            //if there are still items to be shown in this content object
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


    this.GetStructure= function (){
        //If there is a predefined structure for the presantation
        //this function extracts it
        var structure = document.getElementById("structure");
        this.songs = {};
        for (var i=0;i<structure.childNodes.length;i++){
            if (structure.childNodes[i].nodeName!=="#text"){
                //If the structure div contains tags
                if (structure.childNodes[i].tagName=="SONG"){
                    var role = structure.childNodes[i].getAttribute("role");
                    //ADD [here] a test for seeing whether allsongs actually contains something by this name
                    //...
                    // If the type of content was a song, add it to the
                    // presentation from the allsongs global variable

                    var song = allsongs[structure.childNodes[i].innerText.toLowerCase()];
                    //First, add the title of the song to presentation as a separate item
                    this.contents[this.contents.length] = song.titleslide;
                    //Then, add the actual song
                    this.contents[this.contents.length] = song;
                    //Add the song also to a structured list
                    this.songs[role] = song;
                }
                else{
                    this.contents[this.contents.length] = structure.childNodes[i];
                }
            }
        }
        return 0;
    };


}


function MajakkaMessu(){
    //Pre-defined services...
    //These inherit from the general presentation class
    this.GetStructure();
    this.showtype = "majakka";
    var johdanto = new Section('Johdanto');
    johdanto.items = [new SectionItem('Alkulaulu',this.songs['Alkulaulu']),
                      new SectionItem('Alkusanat ja seurakuntalaisen sana',false)];
    //johdanto.CreateLeftbanner();
    this.sections = [johdanto];

    this.contents = [];
    for(var i in this.sections){
        thissection = this.sections[i];
        //add all the sections to the presentation
        this.contents[this.contents.length] = new SongTitleContent(thissection.name);
        for(var a in thissection.items){
            //add all the items in the section
            thisitem = thissection.items[a];
            thiscontent = false;
            if (thisitem.content){
                //If this SectionItem is a song etc. add the actual song
                thiscontent = thisitem.content;
            }
            //Create the header and add it to contents
            this.contents[this.contents.length] = new SectionTitleContent(thissection,a);
            if(thiscontent){
                this.contents[this.contents.length] = thiscontent;
            }
        }
    }
}

MajakkaMessu.prototype = new Presentation();
MajakkaMessu.prototype.constructor = MajakkaMessu;

function SectionItem(name,contentobject){
    this.name = name;
    this.content = contentobject;
}

function Section(name,items){
    //The presentation may be divided into sections
    this.name = name;
    this.items = items;
    this.CreateLeftbanner = function(highlighted){
        leftbanner = document.createElement('ul');
        for(var i in this.items){
            thisitem = this.items[i];
            this_li = document.createElement('li');
            this_li.innerText = thisitem.name;
            if (i==highlighted){
                this_li.className = "sectionitemhl";
            }
            leftbanner.appendChild(this_li);
        }
        return leftbanner;
    };
    this.pointer = 0;
    //Think about inheriting this from screencontent?
    this.Show = 
        function(){
            //Print the content of this object to screen
            currentitem = this.items[this.pointer];
            ClearContent(Screen.textcontent);
            if (currentitem.content){
                //If this item is a song or some other object
                currentitem.Show();
            }
            else{
                //If this is just an empty section header
                Screen.textcontent.appendChild(currentitem);
            }
        };
}

function ScreenContent(){
    // Screencontent is the class that contains the actual data to be shown

    this.custombg="";
    this.id = CreateUid();
    //The pointer property is important. It Tells which item to show
    this.pointer = 0;
    // item here means the content blocks divided into 
    // parts that will be shown at the time
    this.items = [];
    this.Show = 
        function(){
            //Print the content of this object to screen
            ClearContent(Screen.textcontent);
            Screen.textcontent.appendChild(this.items[this.pointer]);
        };
}

function SongContent(title, songtexts){
    // Songcontent is a class for the actual songs

    this.titleslide = new SongTitleContent(title);
    this.songtexts = songtexts;
    this.items = 
        function(content){
            // split the song content to an array consisting of verses;
            // This is a bit hacky: removing empty lines
            // Should rather improve the regex!
                rawcontents = content.split(/(^\s*$\n)+/m);
                for (var i = 0;i<rawcontents.length;i++){
                    if (rawcontents[i] === "" || rawcontents[i].search(/^\s+$/g) != -1){
                        rawcontents.splice(i,1);
                    }
                }
                //Transform the verses to DOM elements
                //These two loops should probably be combined 
                domcontents = [];
                for (verseid in rawcontents){
                    domcontents[verseid] = document.createElement('p');
                    domcontents[verseid].className = 'verse';
                    domcontents[verseid].innerText = rawcontents[verseid];
                }
                return domcontents;
            }(this.songtexts);
    this.PrintTitleSlide = 
        function(){
        
        };
}

//Take care of inheritance

SongContent.prototype = new ScreenContent();
SongContent.prototype.constructor = SongContent;

function SongTitleContent(title){
    //Notice, that the songs titles are not a part of the 
    //songs "items" array, but rather a separate object,
    //linked to the song by the songs "titleslide" porperty.
    //The titles are printed ONLY as parts of a presentation
    //
    el = document.createElement('p');
    el.className = 'songtitle';
    el.innerText = title;
    this.items = [el];
}

SongTitleContent.prototype = new ScreenContent();
SongTitleContent.prototype.constructor = SongTitleContent;

function SectionTitleContent(section,curitem){
    //
    this.items = [section.CreateLeftbanner(curitem)];
    return 0;
}

SectionTitleContent.prototype = new ScreenContent();
SectionTitleContent.prototype.constructor = SectionTitleContent;

function BibleContent(){
}

function InfoContent(){
}


//========================================
//
function ClearContent(myNode){
    //Remove child nodes,
    //see also http://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
}
}

function GetSongs(){
    //Fetch the songs from  the html file

    var songs = [];

    var songdivs = document.getElementsByClassName("songdata");
    for(var i=0;i<songdivs.length;i++){
        // Add a new songcontent object to the songs container object
        // todo: composer, writer

        content = songdivs[i].getElementsByClassName("songdatacontent")[0].innerText;
        title = songdivs[i].getElementsByClassName("songtitle")[0].innerText;
        songs[songdivs[i].id.toLowerCase()] = new SongContent(title, content);
    }

    return songs;
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

//========================================

var Screen =  {};
//The Global screen variables point to the places on the
//screen, where content is shown to the audience
//this.textcontent = document.getElementById("textcontent");
Screen.textcontent = document.getElementById("textcontent");

var allsongs = GetSongs();
var pres = new Presentation();
var Majakka = new MajakkaMessu();


//========================================
