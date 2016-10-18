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
    this.screen = undefined;

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
            thisobject.Show(this.screen);
            this.GetContentChain();
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
    //mark the section idx for each of the sections TODO find a better way
    for(var sec_idx in this.items){
        this.items[sec_idx].sec_idx = sec_idx;
    }
    SetPointers(this, true);
    this.GetContentChain();

    this.CreateNavigation = function(){
        //Create links in the secondary screen for jumping from one section to another
        var mainsec = CreateTag("section","",document, "navsection");
        //This is where the general navigation between sections is
        var leftsec = CreateTag("section","section_nav", document, "navchildsec", mainsec);
        //This is where the upcoming/previous slides will be presented
        var rightsec = CreateTag("section","previewer", document, "navchildsec", mainsec);

        var link = document.createElement('a');
        link.href = '#';
        link.innerText = 'Avaa esitys';
        link.addEventListener('click',OpenPres,false);

        var sectionlist = document.createElement('ul');
        sectionlist.id = "navigator_sectionlist";
        for (var section_idx in this.items){
            var thissec = this.items[section_idx];
            var this_li = document.createElement('li');
            this_li.innerText = thissec.name;
            //The section_nav_header class helps in highlighting in the navigator
            sec_classname = "unhlsection";
            this_li.className = sec_classname;
            ListToLink(this_li, section_idx, 0);
            //Now, feed the lower level elements to the tree
            var subsectionlist = document.createElement('ul');
            for (var subsection_idx in thissec.items){
                var thissubsec = thissec.items[subsection_idx];
                var this_subli = document.createElement('li');
                this_subli.className = sec_classname;
                this_subli.innerText = thissubsec.name;
                if (thissubsec.itemtype == 'song'){
                    //TODO: get rid of the magic number
                    this_subli.innerText += ': ' + thissubsec.items[1].titleslide.titletext;
                }
                subsectionlist.appendChild(this_subli);
                ListToLink(this_subli, section_idx, subsection_idx);
            }
            this_li.appendChild(subsectionlist);
            sectionlist.appendChild(this_li);
        }
        leftsec.appendChild(link);
        leftsec.appendChild(sectionlist);
        document.body.appendChild(mainsec);
    };
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
        //Make sure the value is interpreted corretly after jumping from links etc
        this.position = parseInt(this.position);
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

function Section(mypresentation, name, items, sec_idx){
    //The presentation may be divided into sections
    this.sec_idx = undefined;
    //mypresentation saves reference to the 'parent' pres
    this.mypresentation = mypresentation;
    this.CreateLeftbanner = function(highlighted){
        var leftbanner = document.createElement('ul');
        for(var i in this.items){
            thisitem = this.items[i];
            var this_li = document.createElement('li');
            this_li.innerText = thisitem.name;
            ListToLink(this_li, this.sec_idx, i);
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
            ListToLink(this_li, section_idx, 0);

            if (section_idx == this.mypresentation.pointer.position){
                this_li.className = "sectionhl";
            }
            sectionbanner.appendChild(this_li);
        }
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

function Mover(evt){
    var linktype = evt.target.getAttribute('linktype');
    var sectiontarget = evt.target.getAttribute('sectionidx');
    //The latter is for songs, speeches etc i.e. subitems of sections
    var secitemtarget = evt.target.getAttribute('secitemidx');

    //TODO: abstract this!
    var currentpres = Presentations[0];
    var targetcontent = undefined;
    //TODO make this not specific to majakka presentations
    if (currentpres.showtype == 'majakka'){
                currentpres.current = currentpres.items[sectiontarget];
                currentpres.pointer.position = parseInt(sectiontarget);
                currentpres.pointer.started = true;
                //TODO some more abstraction to this 
                for (var section_idx in currentpres.items) {
                    var thissection = currentpres.items[section_idx];
                    if (section_idx < sectiontarget){
                        AdjustPointersFromSectionDown(thissection, 'max', undefined);
                    }
                    else if (section_idx == sectiontarget){
                        var targetcontent = AdjustPointersFromSectionDown(thissection, 'min', secitemtarget);
                    }
                    else if (section_idx == sectiontarget){
                        AdjustPointersFromSectionDown(thissection, 'min', undefined);
                    }
                }
    }
    currentpres.GetContentChain();
    targetcontent.Show(currentpres.screen);
}

function VerseMover(evt){
    //TODO: make this a way of jumping from a song's verse to another by clicking thee verrse 
    //in the navigator window (started 29.9.2016)
    var tag = evt.target;
    var thispres = Presentations[Presentations.length-1];
    //Find the current song on display
    thispres.GetContentChain();
    var thissong = thispres.chain[thispres.chain.length-1];
    thissong.pointer.position = tag.getAttribute('pointerpos');
    thissong.Show(thispres.screen);
}

function ScreenContent(){
    // Screencontent is the class that contains the actual data to be shown

    this.custombg="";
    this.content_type = "";
    // item here means the content blocks divided into 
    // parts that will be shown at the time
    this.items = [];
    this.Show = function(PresScreen){
            //Print the content of this object to screen

            //1. Clear the layout of the screen
            //TODO: only do this when necessary
            PresScreen.Refresh();
            //2. make shure the item is shown only once
            this.pointer.started = true;

            switch (this.content_type){ 
                case "song":
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer.position]);
                    //Set what's seen in the navigator screen
                    break;
                case "sectiontitle":
                    sitem = this.mysection.current;
                    PresScreen.UpdateContent('sections',this.mysection.PrintSectionName());
                    PresScreen.UpdateContent('sitems',this.mysection.CreateLeftbanner(this.mysection.pointer.position));
                    if (sitem.itemtype=='song'){
                        //Consider removing the itemtype prop!
                        //Insert the song's title as a content on the right of the screen
                        //Songs as sectionitems are always of the format:
                        //[sectiiontitle, song]
                        //this is why items[1]
                        PresScreen.UpdateContent('itemtitle',sitem.items[1].titleslide.items[0]);
                        //TODO: lyrics by, music by...
                    }
                    break;
                case "songtitle":
                    //Think about songtitles also as not part of a special sectioned service
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer]);
                    break;
                default:
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer]);
                    break;
            }
            //Add or remove content from te navigator
            this.UpdatePreview();
        };


this.UpdatePreview = function(){
    var prevsec = document.getElementById('previewer');
    var thispres = Presentations[Presentations.length-1];
    // Update section highlighters
    var navsection = document.getElementById('navigator_sectionlist');
    for (var navel_idx in navsection.children){
        if (isNumber(navel_idx)){
            var this_item = navsection.children[navel_idx];
            var subitems = this_item.children[0].children;
            this_item.className = "unhlsection";
            if(this_item.getAttribute("sectionidx")==thispres.current.sec_idx){
                this_item.className = "sectionnavhl";
            }
        }
        for (var subitem_idx in subitems){
            //subsection headers
            if (isNumber(subitem_idx)){
                var this_subitem = subitems[subitem_idx];
                this_subitem.className = "unhlsection";
                if(this_subitem.getAttribute("sectionidx")==thispres.current.sec_idx){
                    this_subitem.className = "sectionnavhl";
                    if(this_subitem.getAttribute("secitemidx")==thispres.current.pointer.position){
                        this_subitem.className = "subsectionnavhl";
                    }
                }
            }
        }
    }
    //thispres.chain

    //Remove existing (verse etc) content
    ClearContent(prevsec);
    switch (this.content_type){ 
        //If this is a song, update the preview window
        //TODO: add something for other types as well
        case "song":
        var verselist = CreateTag("div","", document, "");
        for (var verse_idx in this.items){
            var thisverse = this.items[verse_idx].cloneNode(true);
            thisverse.setAttribute('pointerpos',verse_idx);
            thisverse.addEventListener('click',VerseMover,false);
            //ListToLink(this_li, section_idx, 0);
            //highlight the current:
            if (verse_idx == this.pointer.position){
                thisverse.className = 'hlverse';
            }
            verselist.appendChild(thisverse);
        }
        prevsec.appendChild(verselist);
        break;
        default:
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
    this.titletext = title;
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

CreateTag = function(tagname, barid, thisdocument, tagclass, parenttag){
    //These elements are for displaying the structure of the presentation
    bar = thisdocument.createElement(tagname);
    bar.id = barid;
    bar.className = tagclass;
    if (parenttag !== undefined){
        parenttag.appendChild(bar);
    }
    return bar;
}


function Screen(thisdocument){
    this.prescont = CreateTag("div", "prescont", thisdocument);
    this.navwrapper = CreateTag("section", "navwrapper", thisdocument,"",this.prescont);
    this.navcontainer = CreateTag("section", "navcontainer", thisdocument,"",this.navwrapper);
    this.textcontent = CreateTag("div", "textcontent", thisdocument);
    this.heading = CreateTag("nav", "heading", thisdocument);
    var heading = CreateTag("h2", "", thisdocument, "",this.heading);
    heading.innerText = "Majakkamessu";
    var subheading = CreateTag("h3", "", thisdocument, "",this.heading);
    subheading.innerText = "Isä meidän - meidän isä";
    this.sections = CreateTag("nav", "sections", thisdocument);
    this.sitems = CreateTag("nav", "sitems", thisdocument);
    this.itemtitle = CreateTag("div", "itemtitle", thisdocument);

    //For the navigation window
    this.sectionlinks = CreateTag("div", "sectionlinks", thisdocument);
    thisdocument.body.appendChild(this.prescont);

    this.Refresh = function(){
        //TODO Make this a LOOP!
        ClearContent(this.prescont);
        ClearContent(this.navcontainer);
        ClearContent(this.textcontent);
        ClearContent(this.sections);
        ClearContent(this.sitems);
        ClearContent(this.itemtitle);
    };

    this.UpdateContent = function(divname, contentitem){
        //contentitem is a screencontent object
        this[divname].appendChild(contentitem);
        if(divname != "textcontent"){
            //upadting the navigation
            this.navwrapper.appendChild(this.heading);
            this.navcontainer.appendChild(this[divname]);
            this.navwrapper.appendChild(this.navcontainer);
            this.prescont.appendChild(this.navwrapper);
        }
        else{
            ClearContent(this.navcontainer);
            ClearContent(this.navwrapper);
            this.navwrapper.appendChild(this.navcontainer);
            this.navcontainer.appendChild(this[divname]);
            this.prescont.appendChild(this.navwrapper);
        }
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

function AdjustPointersFromSectionDown(thissection, updatetype, targetitem){
    UpdatePointers(thissection, updatetype)
    for (var sitem_idx in thissection.items){
        var thissectionitem = thissection.items[sitem_idx];
        if (targetitem && sitem_idx < targetitem){
            updatetype = 'max';
        }
        else if (targetitem && sitem_idx > targetitem){
            updatetype = 'min';
        }
        else if (targetitem && sitem_idx == targetitem){
            //navigate to the first showable content of the desired sectionitem
            UpdatePointers(thissectionitem, updatetype);
            thissection.current = thissectionitem;
            thissection.pointer.position = targetitem;
            var targetcontent = thissectionitem;
            while(typeof targetcontent.Show === 'undefined'){
                //Iterating down to first showable content
                targetcontent = targetcontent.current;
            }
        }

        if (targetitem !== sitem_idx){
            UpdatePointers(thissectionitem, updatetype);
        }

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

    if (targetitem){
        return targetcontent;
    }
}

function ListToLink(this_li, sectionidx, secitemidx){
    this_li.setAttribute('sectionidx', sectionidx);
    this_li.setAttribute('secitemidx', secitemidx);
    //http://stackoverflow.com/questions/256754/how-to-pass-arguments-to-addeventlistener-listener-function
    this_li.addEventListener('click',Mover,false);
}

function OpenPres(pres){
    preswindow = window.open('','_blank', 'toolbar=0,location=0,menubar=0');
    preswindow.document.write('<html lang="fi"><head><meta http-equiv="Content-Type" content="text/html" charset="UTF-8"><link rel="stylesheet" type="text/css" href="tyylit.css"/></head><body></body>');
    ClearContent(preswindow.document.body);
    ////TODO:this is the key to make separate screen working!
    Presentations[0].screen = new Screen(preswindow.document);
    preswindow.onkeydown = checkKey;
    document.onkeydown = checkKey;
}

//========================================

function checkKey(e) {
    //Kaappaa nuolinäppäimet niin ohjainikkunassa kuin esitysikkunassakin
    //http://stackoverflow.com/questions/5597060/detecting-arrow-key-presses-in-javascript
    e = e || window.event;

    if (e.keyCode == '38') {
        Presentations[Presentations.length-1].Move('decrement');
    }
    else if (e.keyCode == '40') {
        Presentations[Presentations.length-1].Move('increment');
    }
    else if (e.keyCode == '37') {
        Presentations[Presentations.length-1].Move('decrement');
    }
    else if (e.keyCode == '39') {
        Presentations[Presentations.length-1].Move('increment');
    }
}

function isNumber(n) {
// http://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//========================================

//If a new document opened, these variables take care of it
var preswindow = undefined;

var allsongs = GetSongs();
var Majakka = new MajakkaMessu();
//Now, remove all used data from html (structure, html)
ClearContent(document.body);

//var NavScreen =  new Screen(document);

//TODO Get rid of globals!
var Presentations = [];
Presentations.push(Majakka);
Majakka.CreateNavigation();


//========================================
