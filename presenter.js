function Presentation(){
    // PRESENTATION is the class that wraps different content and decides what to show

    // The pointer is set to the id of the 
    // songcontent object currently set as active
    this.contents = [];
    this.started = false;
    // This might be unnecessary:
    this.current = undefined;
    //Setting the pointer.. Will probably be removed as unnecessary
    this.SetActiveContent = function(oid){
        this.pointer = oid;
        return 0;
    };

    this.GetContentChain = function(){
            //Go down the section/sectionitem/songverse etc chain as deep as needed
            //and compile a chain of contents
            thisobject = this;
            this.chain = [thisobject];
            while (thisobject.hasOwnProperty('current')){
                thisobject=thisobject.current;
                this.chain[this.chain.length] = thisobject;
            }
    };

    this.Move = function(movetype){
            //increment pointers
            chain_idx = this.chain.length - 1;
            while(chain_idx >= 0){
                thisobject = this.chain[chain_idx];
                if(['decremented','incremented','started'].indexOf(thisobject.pointer.Move(movetype)) > -1){
                    break;
                }
                chain_idx--;
            }

            while(typeof thisobject.Show === 'undefined'){
                //Iterating down to first showable content
                thisobject = thisobject.current;
            }
            thisobject.Show();
            this.GetContentChain();
            console.log(this.items[0].pointer)
    }


    this.Backwards = function(){
        //TODO combine the ff and bw functions as much as possible!
        if (this.pointer === undefined){
            //If the presentation has not started yet, stop the function
            return false;
        }
        var current = this.contents[this.pointer]

        //Try to increment inner pointer of the current screencontent 
        if(current.pointer>0){
            //if there are still items to be shown in this content object
            //AND if this is not the first content of the presentation
            current.pointer--;
        }
        else{
            //If the content has reached its beginning
            //Move to the previous one IF THERE IS such a thing
            if (this.pointer>0){
                this.pointer--;
                current = this.contents[this.pointer]
            }
        }
        switch(current.content_type){
            case "song":
                break;
            case "sectiontitle":
                if(current.mysection.pointer>0){
                    current.mysection.pointer--;
                }
                break;
            default:
                break;
        }
        current.Show();
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
        //Remove the information from html
        ClearContent(document.getElementById("structure"));
        return 0;
    };
}

function MajakkaMessu(){
    //Pre-defined services...
    //These inherit from the general presentation class
    this.GetStructure();
    this.showtype = "majakka";
    //TODO: make creating these sections simpler
    this.items = [new Section('Johdanto', [['Alkulaulu',this.songs['Alkulaulu'],'song'],
                                              ['Alkusanat ja seurakuntalaisen sana',false,'header']]),
                  new Section('Sana',     [['Päivän laulu',this.songs['Päivän laulu'],'song'],
                                              ['Saarna',false,'header'],
                                              ['Synnintunnustus',false,'header'],
                                              ['Uskontunnustus',false,'header']])
                    ];
                      //TODO ^^ liittyen ehkä mieti, että näkyviin tulisi sanailijan nimi siihen,
                      //missä tavallisesti laulun nimi. Muista myös ajatella laulun tekijänoikeuksia.
    SetPointers(this, true);
    this.GetContentChain();
}
MajakkaMessu.prototype = new Presentation();
MajakkaMessu.prototype.constructor = MajakkaMessu;


function Pointer(pointed){
    //Pointers keep track of a set of contents in order to show them on the screen 
    //on the right moment
    this.max  = pointed.items.length;
    this.pointed = pointed;
    this.started = false;
    this.position = 0;
    this.Move = function(movetype){
        var returnvalue = false;
        if (movetype == "increment"){

            if(this.position +1 < this.max){
                this.position++;
                this.started = true;
                returnvalue =  "incremented";
            }
            else{
                if(!this.started){
                    this.started = true;
                    if (typeof this.pointed.Show === 'undefined'){
                        //if only one content object and this object not showable
                        returnvalue =  false;
                    }
                    else{
                        returnvalue =  "started";
                    }
                }
            }

        }
        else if (movetype == "decrement"){

            if(this.position -1 >= 0){
                this.position--;
                returnvalue = "decremented";
            }
            else{
                returnvalue = false;
            }
        
        }

        //Set the parent object's currently active element
        if (this.pointed.hasOwnProperty('current')){
            pointed.current = pointed.items[this.position];
        }
        return returnvalue;
    };


    this.Decrement = function(){
    };
}

function SectionItem(thissection, name, contentobject,itemtype, item_idx){
    this.name = name;
    this.itemtype = itemtype;
    this.items = [new SectionTitleContent(thissection, item_idx)];
    if (contentobject){
        //If this object has subcontent
        this.items[this.items.length] = contentobject;
    }
    SetPointers(this, true);
}

function Section(name,items){
    //The presentation may be divided into sections
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

    this.PrintSectionName = function(){
        sectionbanner = document.createElement('h1');
        sectionbanner.innerText = this.name;
        return sectionbanner;
    };

    this.name = name;
    this.items = [];
    for (var section_item_idx in items){
        this_sectionitem = items[section_item_idx];
        this.items[this.items.length] = new SectionItem(this, this_sectionitem[0],this_sectionitem[1],this_sectionitem[2],section_item_idx);
    }
    SetPointers(this, true);

}

function ScreenContent(){
    // Screencontent is the class that contains the actual data to be shown

    this.custombg="";
    this.id = CreateUid();
    this.content_type = "";
    // item here means the content blocks divided into 
    // parts that will be shown at the time
    this.items = [];
    this.Show = function(){
            //Print the content of this object to screen

            //1. Clear the layout of the screen
            //TODO: only do this when necessary
            CurrentScreen.Refresh();
            //2. make shure the item is shown only once
            this.pointer.started = true;

            //type-dependently populating the screen
            switch (this.content_type){ 
                case "song":
                    CurrentScreen.UpdateContent('textcontent',this.items[this.pointer.position]);
                    break;
                case "sectiontitle":
                    sitem = this.mysection.current;
                    CurrentScreen.UpdateContent('sections',this.mysection.PrintSectionName());
                    CurrentScreen.UpdateContent('sitems',this.mysection.CreateLeftbanner(this.mysection.pointer.position));
                    if (sitem.itemtype=='song'){
                        //Consider removing the itemtype prop!
                        //Insert the song's title as a content on the right of the screen
                        //Songs as sectionitems are always of the format:
                        //[sectiiontitle, song]
                        //this is why items[1]
                        CurrentScreen.UpdateContent('itemtitle',sitem.items[1].titleslide.items[0]);
                        //TODO: lyrics by, music by...
                    }
                    break;
                case "songtitle":
                    //Think about songtitles also as not part of a special sectioned service
                    CurrentScreen.UpdateContent('textcontent',this.items[this.pointer]);
                    break;
                default:
                    CurrentScreen.UpdateContent('textcontent',this.items[this.pointer]);
                    break;
            }
        };
}

function SongContent(title, songtexts){
    // Songcontent is a class for the actual songs

    this.content_type = "song";
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

    //SOngContent has no "current" property, only a pointer
    SetPointers(this, false);

}
SongContent.prototype = new ScreenContent();
SongContent.prototype.constructor = SongContent;

function SongTitleContent(title){
    //Notice, that the songs titles are not a part of the 
    //songs "items" array, but rather a separate object,
    //linked to the song by the songs "titleslide" porperty.
    //The titles are printed ONLY as parts of a presentation
    //
    this.content_type="songtitle";
    el = document.createElement('p');
    el.className = 'songtitle';
    el.innerText = title;
    this.items = [el];
    SetPointers(this, true);
}
SongTitleContent.prototype = new ScreenContent();
SongTitleContent.prototype.constructor = SongTitleContent;

function SectionTitleContent(section,curitem){
    // Section Titles list the elements (songs, speeches etc) in the current section and 
    // show the current item as highlighted
    this.mysection = section;
    this.content_type = "sectiontitle";
    this.items = [section.CreateLeftbanner(curitem)];
    SetPointers(this, false);
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

function SetPointers(object, setcurrent){
    object.pointer = new Pointer(object);
    if (setcurrent){
        //The "current" property is not set for Sectiontitlecontent etc
        object.current = object.items[0];
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

    //When finished, remove the songdata from the html document!
    ClearContent(document.getElementById('songs'))
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

CreateTag = function(tagname, barid){
    //These elements are for displaying the structure of the presentation
    bar = document.createElement(tagname);
    bar.id = barid;
    return bar;
}

function PresScreen(){

    this.prescont = CreateTag("div", "prescont");
    this.textcontent = CreateTag("div", "textcontent");
    this.sections = CreateTag("nav", "sections");
    this.sitems = CreateTag("nav", "sitems");
    this.itemtitle = CreateTag("div", "itemtitle");
    document.body.appendChild(this.prescont);

    this.Refresh = function(){
        //TODO Make this a LOOP!
        ClearContent(this.prescont);
        ClearContent(this.textcontent);
        ClearContent(this.sections);
        ClearContent(this.sitems);
        ClearContent(this.itemtitle);
    };

    this.UpdateContent = function(divname, contentitem){
        //contentitem is a screencontent object
        this[divname].appendChild(contentitem);
        this.prescont.appendChild(this[divname]);
    }

}


//========================================
// //The Global screen variables point to the places on the
//screen, where content is shown to the audience



var allsongs = GetSongs();

var pres = new Presentation();
var Majakka = new MajakkaMessu();
//Now, remove all used data from html (structure, html)
ClearContent(document.body);
var CurrentScreen =  new PresScreen()


//========================================
