
function Presentation(){
    // PRESENTATION is the class that wraps different content and decides what to show

    // The pointer is set to the id of the 
    // songcontent object currently set as active
    this.items = [];
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
            //Make sure hte presentation is marked as started
            this.pointer.started = true;
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
    }

    this.GetSongs= function (){
        //If there is a predefined structure for the presantation
        //this function extracts it
        var structure = document.getElementById("structure");
        this.songs = {};
        for (var i=0;i<structure.childNodes.length;i++){
            if (structure.childNodes[i].nodeName!=="#text"){
                //If the structure div contains tags
                var role = structure.childNodes[i].getAttribute("role");
                //ADD [here] a test for seeing whether allsongs actually contains something by this name
                //...
                // First, create an array if this is the first song if its type
                if (!this.songs.hasOwnProperty(role)){
                    this.songs[role] = [];
                }

                //then, make a song object from it
                var songname = structure.childNodes[i].textContent.toLowerCase();
                songname = songname.replace(/\s+/,' ');
                var songdata = allsongs[songname];
                if (songdata == undefined){
                    window.alert('Problem with song "' + songname + '"!');
                }

                //Special attributes:
                if (['Jumalan karitsa','Pyhä-hymni'].indexOf(role)>-1){ 
                    var song = new SongContent('', songdata.content);
                }
                else{
                    var song = new SongContent(songdata.title, songdata.content);
                }
                //Add the song to a structured list
                this.songs[role].push(song);
            }
        }
        //Remove the information from html
        //ClearContent(document.getElementById("structure"));
        return 0;
    };

    this.CreateNavigation = function(prestype){
        if(prestype=='default'){
            //Create links in the secondary screen for jumping from one section to another
            var navigatorcontainer = CreateTag("section","navigatorcontainer",document, "");
            //This is where the general navigation between sections is
            var contentlist = CreateTag("section","section_nav", document, "navchildsec", navigatorcontainer);
            //This is where the upcoming/previous slides will be presented
            var versepreview = CreateTag("section","previewer", document, "navchildsec", navigatorcontainer);
            //This is for all the additional functionality such as inserting spontaneous text content, songs, bible slides etc
            navigatorcontainer.appendChild(AddFunctionalitySection());

            var link1 = TagWithText("a","Avaa esitys","switchlink");
            link1.href = '#';
            link1.addEventListener('click',OpenPres,false);

            var link2 = TagWithText("a","Sulje esitys","switchlink");
            link2.href = '#';
            link2.addEventListener('click',ClosePres,false);

            var link = TagParent("p",[link1, link2]);
        }


        var sectionlist = document.createElement('ul');
        sectionlist.id = "navigator_sectionlist";
        if (prestype == 'spontaneous'){
            sectionlist.id = "addedcontent_sectionlist";
            sectionlist.className='unhlnavsection';
        }
        else{
            //Highlight the default presentation's navigation
            sectionlist.className='hlnavsection';
        }

        for (var section_idx in this.items){
            var thissec = this.items[section_idx];
            var this_li = document.createElement('li');
            if (thissec.hasOwnProperty('name')){
                this_li.textContent = thissec.name;
            }
            else{
                this_li.textContent = 'Untitled';
            }
            //The section_nav_header class helps in highlighting in the navigator
            sec_classname = "unhlsection";
            this_li.className = sec_classname;
            ListToLink(this_li, section_idx, 0);
            //Now, feed the lower level elements to the tree
            if (thissec.constructor==Section){
                var subsectionlist = document.createElement('ul');
                for (var subsection_idx in thissec.items){
                    var thissubsec = thissec.items[subsection_idx];
                    var this_subli = document.createElement('li');
                    this_subli.className = sec_classname;
                    this_subli.textContent = thissubsec.name;
                    if (thissubsec.itemtype == 'song'){
                        //TODO: get rid of the magic number
                        this_subli.textContent += ': ' + thissubsec.items[1].titleslide.titletext;
                    }
                    subsectionlist.appendChild(this_subli);
                    ListToLink(this_subli, section_idx, subsection_idx);
                }
            this_li.appendChild(subsectionlist);
            }
            sectionlist.appendChild(this_li);
        }
        if(prestype=='default'){
            var linkheader = TagWithText("h3","Sisältö","unhlpresentation");
            linkheader.id = 'defaultcontentheader';
            linkheader.addEventListener('click',SwitchToDefault,false);
            contentlist.appendChild(linkheader);

            contentlist.appendChild(link);
            contentlist.appendChild(sectionlist);

            //This is where any spontaneously added slides will be listed
            var linkheader = TagWithText("h3","Lisätty sisältö","unhlpresentation");
            linkheader.id = 'addedcontentheader';
            linkheader.addEventListener('click',SwitchToSpontaneous,false);
            contentlist.appendChild(TagParent("div",[linkheader,TagParent("div",[],"","addedcontent")],"","addedcontentparent"));

            document.body.appendChild(navigatorcontainer);
            document.body.style.overflow="auto";
        }
        else{
            var container = document.getElementById('addedcontent');
            ClearContent(container);
            container.appendChild(sectionlist);
        }

    };

    this.AddContent = function(newcontent){
            this.items.push(newcontent);
            this.current = this.items[0];
            this.CreateNavigation('spontaneous');
            this.GetContentChain();
            for(var sec_idx in this.items){
                this.items[sec_idx].sec_idx = sec_idx;
            }
            SetPointers(this, true);
    }
}

function MajakkaMessu(){
    //Pre-defined services...
    //These inherit from the general presentation class

    this.GetCredits = function (){
                var vastuut = document.getElementsByClassName("vastuudata");
                var vastuulist = [];
                //Save the credits to be referenced elswhere, too
                this.credits = {};
                for(var i=0;i<vastuut.length;i++){
                    // Add a new songcontent object to the songs container object
                    // todo: composer, writer
                    var vastuu = vastuut[i];
                    if(vastuu.id=='Sanailija'){
                        vastuu.id = "Seurakuntalaisen sana";
                    
                    }
                    if (vastuu.id !== 'Saarnateksti'){
                        vastuulist.push(vastuu.id + ": " + vastuu.textContent);
                        this.credits[vastuu.id] = vastuu.textContent;
                    }
                }
                return vastuulist;
            };

    this.GetSongs();
    this.showtype = "majakka";
    //TODO: import this from structure html
    this.title = document.getElementById('messutitle').textContent;
    var credits1 = new CreditContent('', this.GetCredits());
    //TODO: make creating these sections simpler
    //1. Collect all worship songs and make them into a section
    var communionsongs = MultiSong(this.songs,"Ehtoollislauluja", "Ehtoollislaulu ");
    var lapsicredits = "Pyhistä vetää tänään " + this.credits["Pyhis"] + ", klubissa " + this.credits["Klubi"];
    var info1 = new InfoContent('Lapsille ja lapsiperheille', ['Päivän laulun aikana 3-6-vuotiaat lapset voivat siirtyä pyhikseen ja yli 6-vuotiaat klubiin.', 'Seuraa vetäjiä - tunnistat heidät lyhdyistä!', lapsicredits]);
    var ehtoollisinfo  = new InfoContent('Ehtoolliskäytännöistä', ['Voit tulla ehtoolliselle jo Jumalan karitsa -hymnin aikana', 'Halutessasi voit jättää kolehdin ehtoolliselle tullessasi oikealla olevaan koriin.']);
    var evankeliumi = new BibleContent(document.getElementById('evankeliumi').getAttribute('address'), document.getElementById('evankeliumi').textContent );

    var rukouscredits = "Rukouspalvelijana tänään " + this.credits["Rukouspalvelu"] + ". ";
    //TODO: Hae esirukoilijatieto autom.
    var wsinfo  = new InfoContent('Ylistys- ja rukousosio', ['Ylistys- ja rukouslaulujen aikana voit kirjoittaa omia  rukousaiheitasi ja hiljentyä sivualttarin luona.', ' Rukouspalvelu hiljaisessa huoneessa. ' + rukouscredits]);
    var worshipsongs = MultiSong(this.songs,"Ylistys- ja rukouslauluja", "Ylistyslaulu ", ['rukousinfo', wsinfo, 'info']);
    worshipsongs.push(['Esirukous',false,'header']);


    //2. Combine all the sections
    this.items = [new Section(this, 'Johdanto',           [['Krediitit1',credits1,'info'],
                                                          ['Alkulaulu',this.songs['Alkulaulu'][0],'song'],
                                                          ['Alkusanat',false,'header'],
                                                          ['Seurakuntalaisen sana',false,'header'],
                                                          ['Pyhisinfo',info1,'info']
                                                          ]),
                  new Section(this, 'Sana',               [['Päivän laulu',this.songs['Päivän laulu'][0],'song'],
                                                          ['Evankeliumi',evankeliumi,'header'],
                                                          ['Saarna',false,'header'],
                                                          ['Synnintunnustus',false,'header'],
                                                          ['Uskontunnustus',new SongContent('', allsongs["uskontunnustus"].content),'song']]),
                  new Section(this, 'Ylistys ja rukous', worshipsongs),
                  new Section(this, 'Ehtoollisen asetus', [['Pyhä',this.songs['Pyhä-hymni'][0],'song'], 
                                                          ['Ehtoollisrukous',false,'header'],
                                                          ['Isä meidän',new SongContent('', allsongs["isä meidän"].content),'song'],
                                                          ['Ehtoollisinfo', ehtoollisinfo, 'info'],
                                                          ['Jumalan karitsa',this.songs['Jumalan karitsa'][0],'song']]),
                  new Section(this, 'Ehtoollisen vietto',   communionsongs),
                  new Section(this, 'Siunaus ja lähettäminen',  [['Herran siunaus',false,'heading'],
                                                         ['Loppusanat',false,'heading'],
                                                         ['Loppulaulu',this.songs['Loppulaulu'][0],'song']
                                                          ])
                    ];
                      //TODO ^^ liittyen ehkä mieti, että näkyviin tulisi sanailijan nimi siihen,
                      //missä tavallisesti laulun nimi. Muista myös ajatella laulun tekijänoikeuksia.
    //mark the section idx for each of the sections TODO find a better way
    for(var sec_idx in this.items){
        this.items[sec_idx].sec_idx = sec_idx;
    }
    SetPointers(this, true);
    this.GetContentChain();


}

MajakkaMessu.prototype = new Presentation();
MajakkaMessu.prototype.constructor = MajakkaMessu;

function MultiSong(songlist, songrole, header, constantinfo){
    songs = [];
    var wscounter = 1;
    for(var songidx in songlist[songrole]){
        var wsong = songlist[songrole][songidx];
        songs.push(['Laulu: ' +  wsong.titletext, wsong, songrole]);
        if(constantinfo!==undefined){
            if (songidx < songlist[songrole].length -1 ){
                //Don't add the info after the last song
                songs.push(constantinfo);
            }
        }
        wscounter++;
    }
    return songs
}

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
    if(itemtype == 'info' || itemtype == 'credits'){
        this.items = [contentobject];
    }
    else{
        this.items = [new SectionTitleContent(thissection, item_idx)];
        if (contentobject){
            //If this object has subcontent
            if (itemtype.match(/(song|laulu)/g)){
                //Print song's title with the role as the first slide
                var printedname = name;
                if (itemtype.match(/laulu/g)){
                    //Printn the role differently if worship or communion songs in question
                    var printedname = itemtype;
                }
                var div = TagParent('div', [TagWithText('h3',printedname), TagWithText('h2',contentobject.titletext)],'songtitlediv');
                contentobject.items.unshift(div);
                SetPointers(contentobject,false);
            }
            else{
            }
            this.items.push(contentobject);
            thissection.mypresentation.flatsructure.push(contentobject);
        }
    }
    
    SetPointers(this, true);
}

function Section(mypresentation, name, items, sec_idx){
    //The presentation may be divided into sections
    this.sec_idx = undefined;
    //mypresentation saves reference to the 'parent' pres
    this.mypresentation = mypresentation;
    this.CreateLeftbanner = function(highlighted){
        highlighted = parseInt(highlighted);
        var leftbanner = document.createElement('ul');
        //How many preceding / upcoming sections will be shown in the list
        var sectionbuffer = 1;
        //This is to keep track on the number of visible headers
        //despite the infocontents that are not listed
        var itemcounter = 0;

        //If there is "uncounted" (info) content between diaplayed contents
        //fix  the highlighted number
        var actualhighlighted = highlighted;
        for(var i in this.items){
            thisitem = this.items[i];
            if(i == highlighted){
                break;
            }
            else if (['info'].indexOf(thisitem.itemtype)>-1){ 
                //Decrease by one if uncounted material precedes
                actualhighlighted--;
            }
        }

        for(var i in this.items){
            if (actualhighlighted == 0 || actualhighlighted == this.mypresentation.items.length){
                //set minimum number of visible headings to 3
                sectionbuffer = 2;
            }
            if((itemcounter>=actualhighlighted-sectionbuffer && itemcounter<=actualhighlighted+sectionbuffer) || i == highlighted){
                thisitem = this.items[i];
                if (['info'].indexOf(thisitem.itemtype)==-1){ 
                    //If the object won't be added to the list of section items shown on the main screen
                    var this_li = document.createElement('li');
                    if(["Saarna", "Seurakuntalaisen sana"].indexOf(thisitem.name)>-1){
                        this_li.textContent = thisitem.name + ": " + Presentations.default.credits[thisitem.name];
                    }
                    else{
                        this_li.textContent = thisitem.name;
                    }
                    ListToLink(this_li, this.sec_idx, i);
                    if (i==highlighted){
                        this_li.className = "sectionitemhl";
                    }
                    leftbanner.appendChild(this_li);
                }
                else{
                    itemcounter--;
                }
            }
            itemcounter++;
        }
        return leftbanner;
    };

    this.PrintSectionName = function(){
        //Print a list of section names and highlight the current one
        //TODO: COmbine this and Create left banner
        var sectionbanner = document.createElement('ul');
        //How many preceding / upcoming sections will be shown in the list
        var sectionbuffer = 1;
        for(var section_idx in this.mypresentation.items){
            highlighted = this.mypresentation.pointer.position;
            if (highlighted == 0 || highlighted == this.mypresentation.items.length){
                //set minimum visible headings to 3
                sectionbuffer = 2;
            }
            if((section_idx>=highlighted-sectionbuffer && section_idx<=parseInt(highlighted)+parseInt(sectionbuffer)) || section_idx == highlighted){
                var sec = this.mypresentation.items[section_idx];
                var this_li = document.createElement('li');
                this_li.textContent = sec.name;
                ListToLink(this_li, section_idx, 0);

                if (section_idx == this.mypresentation.pointer.position){
                    this_li.className = "sectionhl";
                }
                sectionbanner.appendChild(this_li);
            }
        }
        return sectionbanner;
    };

    this.name = name;
    this.items = [];
    for (var section_item_idx in items){
        this_sectionitem = items[section_item_idx];
        this.items.push(new SectionItem(this, this_sectionitem[0],this_sectionitem[1],this_sectionitem[2],section_item_idx));
    }
    SetPointers(this, true);
}

function Mover(evt){
    var sectiontarget = evt.target.getAttribute('sectionidx');
    //The latter is for songs, speeches etc i.e. subitems of sections
    var secitemtarget = evt.target.getAttribute('secitemidx');

    //TODO: abstract this!
    var currentpres = Presentations[Presentations.current];
    var targetcontent = undefined;

    //TODO make this not specific to majakka presentations
    currentpres.current = currentpres.items[sectiontarget];
    currentpres.pointer.started = true;

    if (currentpres.showtype == 'majakka'){
                currentpres.pointer.position = parseInt(sectiontarget);
                //TODO some more abstraction to this 
                for (var section_idx in currentpres.items) {
                    var thissection = currentpres.items[section_idx];
                    if (section_idx < sectiontarget){
                        AdjustPointersFromSectionDown(thissection, 'max', undefined);
                    }
                    else if (section_idx == sectiontarget){
                        var targetcontent = AdjustPointersFromSectionDown(thissection, 'min', secitemtarget);
                    }
                    else if (section_idx > sectiontarget){
                        AdjustPointersFromSectionDown(thissection, 'min', undefined);
                    }
                }
    }
    else{
        //If this is a flat presentations, just set the pointers right away
        //TODO: songs
        targetcontent = currentpres.current;
        currentpres.pointer.position = secitemtarget;
    }
    currentpres.GetContentChain();
    targetcontent.Show();
}

function VerseMover(evt){
    //TODO: make this a way of jumping from a song's verse to another by clicking thee verrse 
    //in the navigator window (started 29.9.2016)
    var tag = evt.target;
    var thispres = Presentations[Presentations.current];
    //Find the current song on display
    thispres.GetContentChain();
    var thissong = thispres.chain[thispres.chain.length-1];
    thissong.pointer.position = tag.getAttribute('pointerpos');
    while(thissong.pointer.position == undefined){
        tag = tag.parentNode;
        thissong.pointer.position = tag.getAttribute('pointerpos');
    }
    thissong.Show();
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

            PresScreen = Presentations.screen;
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
                        //PresScreen.UpdateContent('itemtitle',sitem.items[1].titleslide.items[0]);
                        //TODO: lyrics by, music by...
                    }
                    //Adjust the Section headings to the center
                    AdjustHeadings(PresScreen);
                    break;
                case "info":
                    //Think about songtitles also as not part of a special sectioned service
                    PresScreen.UpdateContent('infobox',this.items[this.pointer.position]);
                    break;
                case "credits":
                    //Think about songtitles also as not part of a special sectioned service
                    PresScreen.UpdateContent('creditbox',this.items[this.pointer.position]);
                    break;
                default:
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer.position]);
                    break;
            }
            //Add or remove content from te navigator
            this.UpdatePreview();

        };


this.UpdatePreview = function(){
    var prevsec = document.getElementById('previewer');
    var thispres = Presentations[Presentations.current];
    // Update section highlighters
    if (Presentations.current == 'default'){
        var navsection = document.getElementById('navigator_sectionlist');
    }
    else{
        var navsection = document.getElementById('addedcontent_sectionlist');
    }

    for (var navel_idx in navsection.children){
        if (isNumber(navel_idx)){
            var this_item = navsection.children[navel_idx];
            if (this_item.children.length>0){
                var subitems = this_item.children[0].children;
                this_item.className = "unhlsection";
                if(this_item.getAttribute("sectionidx")==thispres.current.sec_idx){
                    this_item.className = "sectionnavhl";
                }
            }
            else{
                //If this is not a sectioned but a flat presentation
                if(this_item.getAttribute("sectionidx")==thispres.current.sec_idx){
                    this_item.className = "sectionnavhl";
                }
                else{
                    this_item.className = "unhlsection";
                }
            }
        }
        if(subitems!==undefined){
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
            var link = TagWithText("a","Seuraava dia >>","");
            link.addEventListener('click', NextSlide, false);
            document.getElementById("previewer").appendChild(link);
        break;
    }
    document.body.style.overflow="auto";
};

}

function AdjustHeadings(screen){
    //Get seciton item list position and height
    var sitemspos = PosFromTop(screen.sitems);
    //var sectionspos = PosFromTop(screen.sections);
    //var wrapperheight = screen.navwrapper.offsetHeight;
    //Get current sectiontitle position and height
    var hlheading = screen.doc.getElementsByClassName('sectionhl')[0];
    var hlheadingpos = PosFromTop(hlheading);
    //Calculate: if too low, raise the active section heading
    distancetotop = hlheadingpos - sitemspos;
    if(distancetotop > 2*hlheading.offsetHeight){
        screen.sections.style.marginTop = "-" + (distancetotop) + "px";
    }
    else{
        //screen.sections.style.marginTop = "0px";
    }
    //Set the maximum size for the heading list
    screen.sections.style.height = hlheading.offsetHeight*4;
    screen.sitems.style.height = screen.sitems.childNodes[0].offsetHeight + 50 + "px";

}


function SongContent(title, songtexts){
    // Songcontent is a class for the actual songs

    //Make sure first letter uppercase, others lower
    if(title!==undefined){
        try{
            var origtitle = title;
            title = title[0].toUpperCase() + title.substr(1,title.length-1).toLowerCase();
        }
        catch(error){
            console.log(origtitle);
        }
    }
    this.id = CreateUid();
    this.content_type = "song";
    this.titleslide = new SongTitleContent(title);
    this.titletext = title;
    this.name = title;
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
                    domcontents[verseid].innerHTML = rawcontents[verseid].replace(/\n/g, '<br>');
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
    this.id = CreateUid();
    this.content_type="songtitle";
    el = document.createElement('p');
    el.className = 'songtitle';
    el.textContent = title;
    this.titletext = title;
    this.items = [el];
    SetPointers(this, true);
}
SongTitleContent.prototype = new ScreenContent();
SongTitleContent.prototype.constructor = SongTitleContent;

function SectionTitleContent(section,curitem){
    // Section Titles list the elements (songs, speeches etc) in the current section and 
    // show the current item as highlighted
    this.id = CreateUid();
    this.mysection = section;
    this.content_type = "sectiontitle";
    this.items = [];
    SetPointers(this, false);
    section.mypresentation.flatsructure.push(this);
    return 0;
}
SectionTitleContent.prototype = new ScreenContent();
SectionTitleContent.prototype.constructor = SectionTitleContent;

function CreditContent(headertext, infotext, content_name){
    this.id = CreateUid();
    this.content_type="credits";
    if (content_name!==undefined){
        this.name = content_name;
    }

    var div = document.createElement('div');
    var body = document.createElement('ul');
    body.className = "infolist";
    for (var info_id in infotext){
        var this_li = document.createElement('li');
        this_li.textContent = infotext[info_id];
        body.appendChild(this_li);
    }

    div.className='creditcontent';
    div.appendChild(body);
    this.titletext = infotext;
    this.items = [div];
    SetPointers(this, false);
}
CreditContent.prototype = new ScreenContent();
CreditContent.prototype.constructor = CreditContent;


function BibleContent(address, content, content_name){
    this.id = CreateUid();
    this.content_type="bibletime";
    if (content_name!==undefined){
        this.name = content_name;
    }
    else{
        this.name = address;
    }
    this.items = [];
    var div = TagParent('div',[TagWithText('h3',address,'bibleheader')])
    verses = content.split(/¤/m);
    for (verseid in verses){
        div.appendChild(TagWithText('p', verses[verseid], 'bibleverse'));
        if ( (parseInt(verseid) + 1) % 2 == 0 ){
            this.items.push(div);
            var div = TagWithText('div','');
        }
    }
    if ((parseInt(verseid) +1 )% 2 > 0){
            this.items.push(div);
    }
    SetPointers(this, false);
}
BibleContent.prototype = new ScreenContent();
BibleContent.prototype.constructor = BibleContent;

function InfoContent(headertext, infotext, content_name){
    this.id = CreateUid();
    this.content_type="info";
    if (content_name!==undefined){
        this.name = content_name;
    }

    var div = document.createElement('div');
    var header = document.createElement('h3');

    if(infotext.constructor === Array){
        //From arrays: build lists
        var body = document.createElement('ul');
        body.className = "infolist";
        for (var info_id in infotext){
            var this_li = document.createElement('li');
            this_li.textContent = infotext[info_id];
            body.appendChild(this_li);
        }
    }
    else{
        var body = document.createElement('p');
        body.textContent = infotext;
    }

    header.className = 'infoheader';
    header.textContent = headertext;
    div.className = 'infocontent';
    div.appendChild(header);
    div.appendChild(body);
    this.titletext = infotext;
    this.items = [div];
    SetPointers(this, false);
}
InfoContent.prototype = new ScreenContent();
InfoContent.prototype.constructor = InfoContent;


function EmbeddedContent(EmbeddedElement, content_name){
    //EmbeddedElement iframe-elementti, videotägi yms...
    this.id = CreateUid();
    this.content_type="info";
    if (content_name!==undefined){
        this.name = content_name;
    }
    else{
        this.name = "Nimetön sisältö"
    }

    this.items = [TagParent("div",[EmbeddedElement],"embedderdiv")];
    SetPointers(this, false);
}
EmbeddedContent.prototype = new ScreenContent();
EmbeddedContent.prototype.constructor = EmbeddedContent;


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

        content = songdivs[i].getElementsByClassName("songdatacontent")[0].textContent;
        title = songdivs[i].getElementsByClassName("songtitle")[0].textContent;
        var songname = songdivs[i].id.toLowerCase();
        songname = songname.replace(/\s+/,' ');
        songs[songname] = {"title":title,"content":content};
    }

    //When finished, remove the songdata from the html document!
    //
    //ClearContent(document.getElementById('songs'))
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



function Screen(newwindow){
    var thisdocument = newwindow.document;
    this.preswindow = newwindow;
    this.prescont = CreateTag("div", "prescont", thisdocument);
    this.navwrapper = CreateTag("section", "navwrapper", thisdocument,"",this.prescont);
    this.navcontainer = CreateTag("section", "navcontainer", thisdocument,"",this.navwrapper);
    this.textcontent = CreateTag("div", "textcontent", thisdocument);
    this.heading = CreateTag("nav", "heading", thisdocument);
    this.infobox = CreateTag("div", "infobox", thisdocument);
    this.creditbox = CreateTag("div", "creditbox", thisdocument);
    var heading = CreateTag("h2", "", thisdocument, "",this.heading);
    //TODO: Avoid the global variable!
    heading.textContent = "Majakkamessu";
    var subheading = CreateTag("h3", "", thisdocument, "",this.heading);
    subheading.textContent = Presentations["default"].title;
    this.sections = CreateTag("nav", "sections", thisdocument);
    this.sitems = CreateTag("nav", "sitems", thisdocument);
    this.itemtitle = CreateTag("div", "itemtitle", thisdocument);
    this.doc = thisdocument;

    //For the navigation window
    this.sectionlinks = CreateTag("div", "sectionlinks", thisdocument);
    thisdocument.body.appendChild(this.prescont);

    this.Refresh = function(){
        //TODO Make this a LOOP!
        ClearContent(this.prescont);
        ClearContent(this.navcontainer);
        ClearContent(this.navwrapper);
        ClearContent(this.textcontent);
        ClearContent(this.sections);
        ClearContent(this.sitems);
        ClearContent(this.itemtitle);
        ClearContent(this.infobox);
        ClearContent(this.creditbox);
    };

    this.UpdateContent = function(divname, contentitem){
        //contentitem is a screencontent object
        this[divname].appendChild(contentitem);
        if(divname != "textcontent"){
            //upadting the navigation
            if (divname == 'infobox'){
                this.navcontainer.style.justifyContent = "center";
                this.navcontainer.style.alignItems = "center";
            }
            else{
                //Only add the header for non-info stuff
                this.navcontainer.style.justifyContent = "flex-start";
                this.navcontainer.style.alignItems = "initial";
                this.navwrapper.appendChild(this.heading);
            }
            this.navcontainer.appendChild(this[divname]);
            this.navwrapper.appendChild(this.navcontainer);
            this.prescont.appendChild(this.navwrapper);
            this.doc.getElementById('navwrapper').style.width = 0.7*this.prescont.offsetWidth + "px";
        }
        else{
            this.prescont.appendChild(this[divname]);
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
            updatetype = 'min';
            //^^ 'min' here means that when moving to an item ALWAYS assume it will be started FROM THE BEGINNING
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

function ClosePres(pres){
    Presentations.screen.preswindow.close();
}

function OpenPres(pres){
    preswindow = window.open('','_blank', 'toolbar=0,location=0,menubar=0');
    preswindow.document.write('<html lang="fi" style="background:black;" ><head><link href="https://fonts.googleapis.com/css?family=Nothing+You+Could+Do|Quicksand" rel="stylesheet"> <meta http-equiv="Content-Type" content="text/html" charset="UTF-8"><link id="stylesetter" rel="stylesheet" type="text/css" href="tyylit2.css"/></head><body></body>');
    ClearContent(preswindow.document.body);
    ////TODO:this is the key to make separate screen working!
    Presentations.screen = new Screen(preswindow);
    preswindow.onkeydown = checkKey;
    document.onkeydown = checkKey;
}

function PresentationContainer(){

    this.default = new MajakkaMessu();
    this.spontaneous =  new Presentation();
    this.current = 'default';

}

//========================================
//


function GetGospel(){
    var gospelnode = document.getElementById('evankeliumi');
}

function SwitchToDefault(){
    Presentations.current = 'default';
    document.getElementById('defaultcontentheader').className = 'hlpresentation';
    document.getElementById('addedcontentheader').className = 'unhlpresentation';
    document.getElementById('navigator_sectionlist').className = 'hlnavsection';
    document.getElementById('addedcontent_sectionlist').className = 'unhlnavsection';
}

function SwitchToSpontaneous(){
    Presentations.current = 'spontaneous';
    document.getElementById('addedcontentheader').className = 'hlpresentation';
    document.getElementById('defaultcontentheader').className = 'unhlpresentation';
    document.getElementById('addedcontent_sectionlist').className = 'hlnavsection';
    document.getElementById('navigator_sectionlist').className = 'unhlnavsection';
}

function ApplyStyles(){
    var stylesetter = Presentations.screen.preswindow.document.getElementById("stylesetter");
    if (stylesetter.href!=='tyylit.css'){
        stylesetter.href = "tyylit2.css";
    }
    else{
        stylesetter.href = "tyylit2.css";
    }

}

function AddFunctionalitySection(){
    var textarea = TagWithText("textarea","Kirjoita tähän tekstiä, jonka haluat näyttää skriinillä","contentinsert");
    textarea.id = 'added_text_content';
    var link = TagWithText("a","Lisää","");
    link.addEventListener('click', AddTextSlide, false);
    var spontcontdiv = TagParent("div",[TagWithText("h4","Lisää tekstidia",""), textarea,TagParent("p",[link])],"","spontcontdiv");
    var textcontsec = TagParent("section",[spontcontdiv],"functionalsection","textcontsec");

    /*
    var link = TagWithText("a","Lisää","");
    var filepicker = TagParent("input",[],"","filepicker");
    filepicker.setAttribute("type","file");
    link.addEventListener('click', AddVideo, false);
    var sec1b = TagParent("section",[TagWithText("h4","Lisää video tiedostosta",""), filepicker, TagParent("p",[link])],"functionalsection","functionsec1b");
    */

    var link = TagWithText("a","Lisää","");
    link.addEventListener('click', AddEmbeddedYoutube, false);
    var image_from_url_link = TagWithText("a","Lisää","");
    link.addEventListener('click', AddEmbeddedYoutube, false);
    image_from_url_link.addEventListener('click', AddImageFromLink, false);

    //TODO: Abstract into functions / objects!
    var url = TagParent("input",[],"","ytembedded");
    url.setAttribute("type","text");
    url.setAttribute("value","kopioi linkki tähän");

    var imgurl = TagParent("input",[],"","imgurl");
    imgurl.setAttribute("type","text");
    imgurl.setAttribute("value","kopioi linkki tähän");

    var url = TagParent("input",[],"","ytembedded");
    url.setAttribute("type","text");
    url.setAttribute("value","kopioi tähän linkki tähän");


    var klink = TagWithText("input");
    klink.setAttribute("type","file");
    klink.addEventListener('change', AddLocalImage, false);

    var vlink = TagWithText("input");
    vlink.setAttribute("type","file");
    vlink.addEventListener('change', AddLocalVideo, false);

    var optionlist = TagParent("ul",[TagParent("li",[TagWithText("span","Kuva tiedostosta",""),TagParent("span",[klink])]), TagParent("li",[TagWithText("span","YouTube-linkki",""), url,link]),TagParent("li",[TagWithText("span","Kuva linkistä",""),imgurl,image_from_url_link])]);
    var embcontsec = TagParent("section",[TagWithText("h4","Lisää media",""),optionlist],"functionalsection","embcontsec");

    var blink = TagWithText("a","Blank screen");
    blink.addEventListener('click', BlankScreen, false);
    var utilities = TagParent("section",[blink],"functionalsection","utsection");

    var stylelink = TagWithText("a","Seuraava tyyli >>");
    stylelink.addEventListener('click', ApplyStyles, false);
    var stylesec = TagParent("section",[TagWithText("h4","Muuta tyylejä",""), stylelink],"functionalsection","stylesec");


    var link = TagWithText("a","Lisää","");
    link.addEventListener('click', AddSongSlide, false);
    var songcontsec = TagParent("section",[TagWithText("h4","Lisää laulu",""), SongListDropDown(),TagParent("p",[link])],"functionalsection","songcontsec");

    var link = TagWithText("a","Lisää","");
    var logger = TagWithText("p","","");
    logger.id = "logger";
    link.addEventListener('click', AddBibleContent, false);
    var select = CreateBookSelect();
    var chapinput = document.createElement("input");
    chapinput.id = 'chapter';
    chapinput.value = 'Luku';
    var verseinput = document.createElement("input");
    verseinput.id = 'verse';
    verseinput.value = 'jae/jakeet';

    var bibcontsec = TagParent("section",[TagWithText("h4","Lisää Raamatunteksti",""),logger, TagParent("div",[select, chapinput, verseinput],'bibaddress'),TagParent('p',[link])],"functionalsection","bibcontsec");

    //Make a container for the iframe doing the bible loading
    var biblenavi = TagWithText("iframe","","biblenavi");
    biblenavi.id = 'biblenavi';
    document.body.appendChild(biblenavi);
    return TagParent("section",[TagWithText("h3","Toiminnot",""), utilities,textcontsec, songcontsec, bibcontsec, embcontsec],"functions_section");
}

function BlankScreen(){
    var div = TagWithText("div","","blankscreen");
    Presentations.screen.doc.getElementById('prescont').appendChild(div);
}

function SongListDropDown(){
    var songnames = [];
    var songoptions = [];

    for (songname in allsongs){
        songnames.push(songname)
    }

    songnames.sort();

    for(idx in songnames){
        var thisname = songnames[idx];
        var option = TagWithText("option",thisname,"");
        songoptions.push(option);
    }

    var select = TagParent("select",songoptions,"","songselect");
    return select;
}

function CreateBookSelect(){

    var booknames = ['Valitse kirja','---------------------','Uusi testamentti','--------------------','Matt', 'Mark', 'Luuk', 'Joh', 'Apt', 'Room', '1Kor', '2Kor', 'Gal', 'Ef', 'Fil', 'Kol', '1Tess', '2Tess', '1Tim', '2Tim', 'Tit', 'Filem', 'Hepr', 'Jaak', '1Piet', '2Piet', '1Joh', '2Joh', '3Joh', 'Juud', 'Ilm','Vanha testamentti', '---------------', '1Moos', '2Moos', '3Moos', '4Moos', '5Moos', 'Joos', 'Tuom', 'Ruut', '1Sam', '2Sam', '1Kun', '2Kun', '1Aik', '2Aik', 'Esra', 'Neh', 'Est', 'Job', 'Ps', 'Sananl', 'Saarn', 'Laull', 'Jes', 'Jer', 'Valit', 'Hes', 'Dan', 'Hoos', 'Joel', 'Aam', 'Ob', 'Joona', 'Miika', 'Nah', 'Hab', 'Sef', 'Hagg', 'Sak', 'Mal']
    var bookoptions = [];
    for(idx in booknames){
        var thisname = booknames[idx];
        var option = TagWithText("option",thisname,"");
        bookoptions.push(option);
    }

    var select = TagParent("select",bookoptions,"","songselect");
    select.id = 'book';
    return select;

}

function checkIframeLoaded() {
    //http://stackoverflow.com/questions/9249680/how-to-check-if-iframe-is-loaded-or-it-has-a-content
    var iframe = document.getElementById('biblenavi');
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (  iframeDoc.getElementById('biblecontent')  !== null) {
        AddLoadedBibleContent();
        document.getElementById('logger').textContent = '';
        return;
    } 
    document.getElementById('logger').textContent = 'Ladataan raaamattu sisältöä, odota hetki';
    window.setTimeout('checkIframeLoaded();', 200);
}

function AddLoadedBibleContent(){
    var book = document.getElementById('book');
    var chapter = document.getElementById('chapter');
    var verse = document.getElementById('verse');
    address = book.options[book.selectedIndex].textContent + " " + chapter.value + " " + verse.value;
    var bibledoc = document.getElementById('biblenavi').contentWindow.document;
    Presentations.spontaneous.AddContent(new BibleContent(address, bibledoc.getElementById('biblecontent').textContent));
}

function AddBibleContent(){
        var book = document.getElementById('book');
        var chapter = document.getElementById('chapter');
        var verse = document.getElementById('verse');
        address = book.options[book.selectedIndex].textContent + "." + chapter.value;
        var biblenavi = document.getElementById("biblenavi");
        ClearContent(biblenavi.contentWindow.document);
        biblenavi.src = 'biblecrawl.php?chap=' + address + '&verses=' + verse.value;
        checkIframeLoaded();
//    catch (error) {
//      alert("Raamattusisällön lisääminen toimii vain palvelimelta ajattuna (vähintään localhost)");
//      return false;
//    }


}

function AddVideo(){
    var filename = document.getElementById("filepicker").value.match(/[^\/\\]+$/);
    filename = filename[0];
    console.log(filename);
}

function AddImageFromLink(){
    var url = document.getElementById("imgurl").value;
    var img = TagParent("img");
    img.src = url;
    Presentations.spontaneous.AddContent(new EmbeddedContent(img, "Kuva"));
    console.log(url);
}

function AddEmbeddedYoutube(){
    var url = document.getElementById("ytembedded").value;
    var idgroups = url.match(/v=(.*)/)
    var videoid = idgroups[1];
    var iframe = TagParent("iframe", [],"","");
    iframe.setAttribute("width","560");
    iframe.setAttribute("height","315");
    iframe.setAttribute("allowfullscreen","");
    iframe.src = "https://www.youtube.com/embed/" + videoid;
    Presentations.spontaneous.AddContent(new EmbeddedContent(iframe, "YouTube-video"));
}

function AddSongSlide(){
    var select = document.getElementById("songselect");
    var selectedsong = select.options[select.selectedIndex].textContent;
    var title  = allsongs[selectedsong].title;
    var song = new SongContent(title, allsongs[selectedsong].content)
    var div = TagParent('div', [TagWithText('h2',title)],'songtitlediv');
    song.items.unshift(div);
    SetPointers(song,false);
    Presentations.spontaneous.AddContent(song);
}

function AddTextSlide(){
    var addedtext = document.getElementById('added_text_content').value;
    var addedtextheader = addedtext;
    if(addedtext.length>20){
        addedtextheader = addedtext.substr(0,20) + "...";
    }
    Presentations.spontaneous.AddContent(new InfoContent('', addedtext, addedtextheader));
}

function AddTextSlide(){
    var addedtext = document.getElementById('added_text_content').value;
    var addedtextheader = addedtext;
    if(addedtext.length>20){
        addedtextheader = addedtext.substr(0,20) + "...";
    }
    Presentations.spontaneous.AddContent(new InfoContent('', addedtext, addedtextheader));
}

TagWithText = function(tagname, tagtext, tagclass){
    var tag = document.createElement(tagname);
    tag.textContent = tagtext;
    tag.className = tagclass;
    return tag;
}

TagParent = function(tagname, childlist, classname, tagid){
    var tag = document.createElement(tagname);
    tag.className = classname;
    for (child_idx in childlist){
        tag.appendChild(childlist[child_idx]);
    }
    if (tagid!==undefined){
        tag.id = tagid;
    
    }
    return tag;
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

function checkKey(e) {
    //Kaappaa nuolinäppäimet niin ohjainikkunassa kuin esitysikkunassakin
    //http://stackoverflow.com/questions/5597060/detecting-arrow-key-presses-in-javascript
    e = e || window.event;

    if (e.keyCode == '38') {
        Presentations[Presentations.current].Move('decrement');
    }
    else if (e.keyCode == '40') {
        Presentations[Presentations.current].Move('increment');
    }
    else if (e.keyCode == '37') {
        Presentations[Presentations.current].Move('decrement');
    }
    else if (e.keyCode == '39') {
        Presentations[Presentations.current].Move('increment');
    }
}

function isNumber(n) {
// http://stackoverflow.com/questions/9716468/is-there-any-function-like-isnumeric-in-javascript-to-validate-numbers
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function PosFromTop(el){
    var rect = el.getBoundingClientRect();
    return rect.top;
}

function AddLocalVideo(evt) {
    var input = evt.target;
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            //var video = TagWithText("source");
            //video.src = e.target.result;
            //<video controls="" autoplay="" name="media"><source src="file:///media/juho/LACIE%20SHARE/Arkisto/videot/lapset/sasun_sanomat.mp4" type="video/mp4"></video>
            //var vparent = TagParent("video",[video]);
            //vparent.setAttribute("controls","");
            //vparent.setAttribute("name","");
            var div = TagWithText("div","");
            div.innerHTML = '<video controls="" autoplay="" name="media"><source src="file:///media/juho/LACIE%20SHARE/Arkisto/videot/lapset/sasun_sanomat.mp4" type="video/mp4"></video>';
            div.children[0].children[0].src = e.target.result;
            Presentations.spontaneous.AddContent(new EmbeddedContent(div, "Video"));
        }

        reader.readAsDataURL(input.files[0]);
    }
}

function AddLocalImage(evt) {
    //http://stackoverflow.com/questions/19005678/how-to-upload-an-image-with-jquery-client-side-and-add-it-to-a-div
    var input = evt.target;
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            var img = TagWithText("img","","embeddedimg");
            img.src = e.target.result;
            Presentations.spontaneous.AddContent(new EmbeddedContent(img, "Kuva"));
        }

        reader.readAsDataURL(input.files[0]);
    }
}

function NextSlide(){
        Presentations[Presentations.current].Move('increment');
}

//========================================


//If a new document opened, these variables take care of it
var preswindow = undefined;
var allsongs = GetSongs();



//TODO Get rid of globals!
//At the moment:
//The global Presentations object is sort of a controller of what is shown on the screen

//TODO: 
//1. make a constructor to the Presentations object
//2. Add a "Save Presentations" -function, which outputs a html documents that contains
//the blueprints of this presentation including the spontaneous content
//
var Presentations = new PresentationContainer();



//Finally, remove all used data from html (structure, html)
//ClearContent(document.body);

Presentations.default.CreateNavigation('default');


//========================================
