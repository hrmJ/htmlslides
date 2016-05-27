var all_screencontents = [];

function Presentation(){
    // PRESENTATION is the class that wraps different content and decides what to show

    // The pointer is set to the id of the 
    // songcontent object currently set as active
    this.contents = [];
    this.started = false;
    // This might be unnecessary:
    this.current = undefined;
    //A try to make jumping in the presentation easier
    this.flatsructure = [];

    this.GetContentChain = function(){
            //Go down the section/sectionitem/songverse etc chain as deep as needed
            //and compile a chain of contents
            thisobject = this;
            this.chain = [thisobject];
            while (thisobject.hasOwnProperty('current')){
                thisobject=thisobject.current;
                this.chain.push(thisobject);
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

                    //first, make a song object from it
                    var songdata = allsongs[structure.childNodes[i].innerText.toLowerCase()];

                    var song = new SongContent(songdata.title, songdata.content);
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
    this.items = [new Section(this, 'Johdanto', [['Alkulaulu',this.songs['Alkulaulu'],'song'],
                                              ['Alkusanat ja seurakuntalaisen sana',false,'header']]),
                  new Section(this, 'Sana',     [['Päivän laulu',this.songs['Päivän laulu'],'song'],
                                              ['Saarna',false,'header'],
                                              ['Synnintunnustus',false,'header'],
                                              ['Uskontunnustus',false,'header']]),
                  new Section(this, 'Ehtoollinen',     [['Kolehtipuhe',false,'header'],
                                              ['Ehtoollisrukous',false,'header'],
                                              ['Isä meidän',false,'header']])
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
        else if (movetype == "unchanged"){
            returnvalue = "started";
        }

        //Set the parent object's currently active element
        if (this.pointed.hasOwnProperty('current')){
            pointed.current = pointed.items[this.position];
        }
        return returnvalue;
    };
    this.maximize = function(){
        //Move the pointer to the end
        this.started = true;
        this.position = this.max-1;
    };
    this.minimize = function(){
        //Move the pointer to the beginning
        //this.started = true;
        this.position = 0;
    }

}

function SectionItem(thissection, name, contentobject,itemtype, item_idx){
    this.name = name;
    this.itemtype = itemtype;
    this.items = [new SectionTitleContent(thissection, item_idx)];
    if (contentobject){
        //If this object has subcontent
        this.items.push(contentobject);
        thissection.mypresentation.flatsructure.push(contentobject);
    }
    
    SetPointers(this, true);
    //finally, add this scrreencontent to the global variable 
    //in order to reference it by links etc.
    //this is a hash with ids as keys
    all_screencontents.push(this);
}

function Section(mypresentation, name, items){
    //The presentation may be divided into sections
    
    //mypresentation saves reference to the 'parent' pres
    this.mypresentation = mypresentation;
    this.CreateLeftbanner = function(highlighted){
        var leftbanner = document.createElement('ul');
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
        //Print a list of section names and highlight the current one
        //TODO: COmbine this and Create left banner
        var sectionbanner = document.createElement('ul');
        for(var section_idx in this.mypresentation.items){
            var sec = this.mypresentation.items[section_idx];
            var this_li = document.createElement('li');
            this_li.innerText = sec.name;

            //Get the first element of this section:
            //TODO abstract this to a function
            //AND make it less hacky
            var firstitem = sec.items[0];
            if (firstitem.hasOwnProperty('items')){
                while (firstitem.hasOwnProperty('items') && firstitem.items[0] instanceof ScreenContent){
                    if(firstitem.items[0] instanceof ScreenContent){
                    firstitem = firstitem.items[0];
                    }
                    if(!firstitem.hasOwnProperty('items')){
                        break;
                    }
                }
            }

            console.log(firstitem)
            this_li.setAttribute('linktype', 'section');
            this_li.setAttribute('linktarget', section_idx);

            //tricky, see this so question:  
            //http://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function
            //And especially, the solution here: http://stackoverflow.com/a/11986895/4609685

            this_li.addEventListener('click',Mover,false);

            if (section_idx == this.mypresentation.pointer.position){
                this_li.className = "sectionhl";
            }
            sectionbanner.appendChild(this_li);
        }
        return sectionbanner;
    };

    this.FixPointers = function(linktarget){
        //When following links, take care that all the pointers are in the right position
    }

    this.name = name;
    this.items = [];
    for (var section_item_idx in items){
        this_sectionitem = items[section_item_idx];
        this.items[this.items.length] = new SectionItem(this, this_sectionitem[0],this_sectionitem[1],this_sectionitem[2],section_item_idx);
    }
    SetPointers(this, true);
}

function Mover(evt){
    var linktype = evt.target.getAttribute('linktype');
    var linktarget = evt.target.getAttribute('linktarget');

    //TODO: abstract this!
    var currentpres = Presentations[0];
    var targetcontent = undefined;
    //TODO make this not specific to majakka presentations
    if (currentpres.showtype == 'majakka'){
        switch(linktype){
            case 'section':
                currentpres.current = currentpres.items[linktarget];
                currentpres.pointer.position = linktarget;
                currentpres.pointer.started = true;
                //TODO some more abstraction to this 
                for (var section_idx in currentpres.items) {
                    var thissection = currentpres.items[section_idx];
                    if (section_idx < linktarget){
                        AdjustPointersFromSectionDown(thissection, 'max');
                    }
                    else{
                        //for content FOLLOWING the target AND for the actual target section, too
                        AdjustPointersFromSectionDown(thissection, 'min');
                        if (section_idx == linktarget){
                            //Finally, navigate to the first showable content of this section
                            targetcontent = thissection.current;
                            while(targetcontent.hasOwnProperty('current')){
                            //TODO: check if the showability of this must be tested
                                targetcontent = targetcontent.current;
                            }
                        }
                    }
                }
                break;
        }
    }
    currentpres.GetContentChain();
    targetcontent.Show();
}


function ScreenContent(){
    // Screencontent is the class that contains the actual data to be shown

    this.custombg="";
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

    this.id = CreateUid();
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
    //finally, add this scrreencontent to the global variable 
    //in order to reference it by links etc.
    //this is a hash with ids as keys
    all_screencontents.push(this);

}
SongContent.prototype = new ScreenContent();
SongContent.prototype.constructor = SongContent;

function SongTitleContent(title){
    //Notice, that the songs titles are not a part of the 
    //songs "items" array, but rather a separate object,
    //linked to the song by the songs "titleslide" porperty.
    //The titles are printed ONLY as parts of a presentation
    //
    this.id = CreateUid();
    this.content_type="songtitle";
    el = document.createElement('p');
    el.className = 'songtitle';
    el.innerText = title;
    this.items = [el];
    SetPointers(this, true);
    //finally, add this scrreencontent to the global variable 
    //in order to reference it by links etc.
    //this is a hash with ids as keys
    all_screencontents.push(this);
}
SongTitleContent.prototype = new ScreenContent();
SongTitleContent.prototype.constructor = SongTitleContent;

function SectionTitleContent(section,curitem){
    // Section Titles list the elements (songs, speeches etc) in the current section and 
    // show the current item as highlighted
    this.id = CreateUid();
    this.mysection = section;
    this.content_type = "sectiontitle";
    this.items = [section.CreateLeftbanner(curitem)];
    SetPointers(this, false);
    //finally, add this scrreencontent to the global variable 
    //in order to reference it by links etc.
    //this is a hash with ids as keys
    all_screencontents.push(this);
    section.mypresentation.flatsructure.push(this);
    return 0;
}
SectionTitleContent.prototype = new ScreenContent();
SectionTitleContent.prototype.constructor = SectionTitleContent;

function BibleContent(){
    this.id = CreateUid();
    //finally, add this scrreencontent to the global variable 
    //in order to reference it by links etc.
    //this is a hash with ids as keys
    all_screencontents.push(this);
}

function InfoContent(){
    this.id = CreateUid();
    //finally, add this scrreencontent to the global variable 
    //in order to reference it by links etc.
    //this is a hash with ids as keys
    all_screencontents.push(this);
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

    var songs = {};

    var songdivs = document.getElementsByClassName("songdata");
    for(var i=0;i<songdivs.length;i++){
        // Add a new songcontent object to the songs container object
        // todo: composer, writer

        content = songdivs[i].getElementsByClassName("songdatacontent")[0].innerText;
        title = songdivs[i].getElementsByClassName("songtitle")[0].innerText;
        songs[songdivs[i].id.toLowerCase()] = {"title":title,"content":content};
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

function UpdatePointers(item, updatetype){
    if (item.hasOwnProperty('pointer')){
        if (updatetype == 'max'){
            item.pointer.maximize();
        }
        else{
            item.pointer.minimize();
        }
    }
    if (item.hasOwnProperty('current')){
        if (updatetype == 'max'){
            item.current = item.items[item.items.length-1];
        }
        else{
            item.current = item.items[0];
        }
    }
}

function AdjustPointersFromSectionDown(thissection, updatetype){
    UpdatePointers(thissection, updatetype)
    for (var sitem_idx in thissection.items){
        var thissectionitem = thissection.items[sitem_idx];
        UpdatePointers(thissectionitem, updatetype);
        if (thissectionitem.hasOwnProperty('items')){
            for (var subitem_idx in thissectionitem.items){
                //songs, section titles etc...
                var sectionitems_subcontent  = thissectionitem.items[subitem_idx];
                UpdatePointers(sectionitems_subcontent, updatetype);
                if (sectionitems_subcontent.hasOwnProperty('items')){
                    //song verses etc
                    for (var subsubitem_idx in sectionitems_subcontent.items){
                        var sectionitems_subsubcontent  = sectionitems_subcontent.items[subsubitem_idx];
                        UpdatePointers(sectionitems_subsubcontent, updatetype);
                    }
                }
            }
        }
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

//TODO Get rid of globals!
var Presentations = [];
Presentations.push(Majakka);


//TODO start using push
//TODO find out more about prototypes and ids
//========================================
