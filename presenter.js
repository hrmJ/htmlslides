/**
 *
 * Represents a container for the two parallel slide shows that each
 * presentation consists of: the structured slide show (default) and
 * the slide show for the spontaneously added content (spontaneous). Both of these
 * are objects of the Presentation class.
 *
 * @constructor
 * @property {Presentation}  default         - a Presentation object containing the actual structured slide show
 * @property {Presentation}  spontaneous     - a Presentation object containing the slide show for the spontaneously added content
 * @property {string}  current               - a string ("default" or "spontaneous") indicating, which of the two slide shows is currently active
 *
 */
function PresentationContainer(){
    var prestype = document.getElementById("messutype").textContent;
    this.default = new StructuredPresentation(document, prestype);
    this.spontaneous =  new Presentation();
    this.current = 'default';
    this.secondbrowser = null;
}



/**
 * Represents coherent sets of slide shows. Practically, every  slide show
 * created with this software consists of two Presentation objects: One for
 * the actual structured slide show (i.e. the worship service and all of its 
 * related structure - pre-specified information slides, sermon, information about
 * people involved in making the service etc.) and the other for spontaneously
 * added content.
 *
 * @constructor
 * @property {object} current - Which subelement is currently being active, e.g. a {@link Section}.
 * @property {Array} items - an array of subitems, in the case of the Presentation class usually Section objects.
 *
 */
function Presentation(){
    this.items = [];
    // This might be unnecessary:
    this.current = undefined;

    /** 
     * Processes the call from the user to move to the next or to the previous
     * slide. 
     *
     * The function starts from the last item of the content chain (marked by
     * the {@link GetContentChain} function).  "The last item of the chain"
     * here means the lowest element in the current hierarchy. For example:
     *
     * The user is currently viewing a song in the "worship songs" -section. 
     *
     * That is, the chain is an array of this form:
     * [{@link StructuredPresentation}, {@link Section}, {@link SectionItem}, {@link SongContent}]
     *
     * 1. The Song is an iterable content, that iterates throug verses
     * 2. The SectionItem is also iterable, it's the container of the song, consisting of the Songs's title slide and the song
     * 3. The Section is the "ylistyslaulut" section of the service, also iterable (consists of multiple SectionItems)
     * 4. Finally, the StructuredPresentation item is also iterable, consisting of multiple sections
     *
     * So, when moving, the program needs to first move the lowest element in
     * the direction specified by the user. If the direction is "increment" and we come to the 
     * last verse and after that try to move forward, the function will recognize, that
     * instead of moving the lowest element in the hierarchy, it now has to move the next item.
     * Now, when the song has ended, the Mover tries to increment the section item instead.
     * Since the song was also the last element of the section item (consisting
     * of the Song's header and the song), the Mover continues up in the hierarchy and tries to
     * move the pointer in the Section. if this isn't the last song, the pointer will now, finally,
     * move forward.
     *
     *
     * @param {string} movetype - either "decrement" or "increment" 
     * 
     */
    this.Move = function(movetype){
            //Make sure the presentation is marked as started
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


    /** 
     * Iterates through the structure of the presentation from top to bottom.
     * Starts with the actual instance of the presentation class, then
     * moves down to the subitem currently active in the parent item
     * until there no longer are any subitems. A typical chain looks like this:
     *
     * 1. Presentation
     * 2. Section (Introduction, Worship and prayer...)
     * 3. Song
     * 4. Verse
     *
     */
    this.GetContentChain = function(){
            //
            //
            thisobject = this;
            this.chain = [thisobject];
            try{
                while (thisobject.hasOwnProperty('current')){
                    thisobject=thisobject.current;
                    this.chain.push(thisobject);
                    if(thisobject==undefined){
                        break;
                    }
                }
            }
            catch(error){
                //alert("Moro");
                console.log(error);
            }
    };


    /**
     *
     * Fetches the names of people involved in the service
     * Also sets the title.
     *
     * @param {DOM document}  doc - The document including the information about structure
     *
     * @property {string} title - The (sub)title of the service
     *
     */
    this.GetCredits = function (doc){
                this.title = doc.getElementById('messutitle').textContent;
                this.maintitle = doc.getElementById('messuheader').textContent;
                var vastuut = doc.getElementsByClassName("vastuudata");
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
                    //if (vastuu.id !== 'Saarnateksti' && vastuu.textContent !== "" && vastuu.textContent !== " "){
                    if (vastuu.id !== 'Saarnateksti'){
                        vastuulist.push(vastuu.id + ": " + vastuu.textContent);
                        this.credits[vastuu.id] = vastuu.textContent;
                    }
                }

                return vastuulist;
    };


    /**
     * Extracts the structure of the slide show from a pre-generated (e.g. by diat.php)
     * html document. Pulls out information on each song that should be part of the service
     * as well as what role the song has (worship song, communion song "song of the day" etc.)
     *
     *
     * @param doc {DOM Document object} - where to get the structure from 
     *
     */
    this.GetSongs= function (doc){
        var structure = doc.getElementById("structure");
        this.songs = {};
        for (var i=0;i<structure.childNodes.length;i++){
            if (structure.childNodes[i].nodeName!=="#text"){
                //If the structure div contains tags
                var role = structure.childNodes[i].getAttribute("role");
                if(role==null || role=="Laulu"){
                    //Simple songs without any specific role
                    role = "song";
                }
                //ADD [here] a test for seeing whether allsongs actually contains something by this name
                //...
                // First, create an array if this is the first song if its type
                if (!this.songs.hasOwnProperty(role)){
                    this.songs[role] = [];
                }

                //then, make a song object from it
                var songname = structure.childNodes[i].textContent.toLowerCase();
                if (songname !== ""){
                    songname = songname.replace(/\s+/,' ');
                    var songdata = allsongs[songname];
                    if (songdata == undefined){
                        //window.alert('Problem with song "' + songname + '"!');
                        console.log(">>" + typeof songname + "<<");
                    }

                    //Special attributes:
                    if (['Jumalan karitsa','Pyhä-hymni'].indexOf(role)>-1){ 
                        try{
                            var song = new SongContent('', songdata.content);
                        }
                        catch(error){
                            console.log(error);
                        }
                    }
                    else if(songdata!==undefined){
                        var song = new SongContent(songdata.title, songdata.content);
                    }
                    else if(songdata==undefined){
                        var song = new SongContent(songname + " (ei sanoja)", "");
                    }
                    //Add the song to a structured list
                    this.songs[role].push(song);
                }
            }
        }
        return 0;
    };

    /**
     *
     * Creates and formats the navigator screen, i.e. the window, by which the
     * user navigates the slide show, including the table of contents, preview
     * of the songs' words and the functionality to add spontaneous content. 
     *
     * @param {string} prestype - "spontaneous" or "default": whether this is for the spontaneous
     * presentation content or the actual structured worship service
     *
     */
    this.CreateNavigation = function(prestype){
        var updated = false;
        if(prestype=='default'){
            //Create links in the secondary screen for jumping from one section to another
            

            var contentlist = document.getElementById("section_nav");
            if(contentlist == undefined){
                var navigatorcontainer = CreateTag("section","navigatorcontainer",document, "");


                //This is where the general navigation between sections is
                var contentlist = CreateTag("section","section_nav", document, "navchildsec", navigatorcontainer);
                //This is where the upcoming/previous slides will be presented
                var versepreview = CreateTag("section","previewer", document, "navchildsec", navigatorcontainer);

                //This is where any spontaneously added slides will be listed
                var linkheader = TagWithText("h3","Lisätty sisältö","unhlpresentation");
                linkheader.id = 'addedcontentheader';
                linkheader.addEventListener('click',SwitchToSpontaneous,false);
                navigatorcontainer.appendChild(TagParent("div",[linkheader,TagParent("div",[],"","addedcontent")],"","addedcontentparent"));
            }
            else{
                ClearContent(contentlist);
                updated = true;
            }

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
                        try{
                            this_subli.textContent += ': ' + thissubsec.items[1].titleslide.titletext;
                        }
                        catch(error){
                            console.log("Tyhjä elementti: ");
                            console.log(thissubsec.items[0]);
                        }
                    }
                    subsectionlist.appendChild(this_subli);
                    ListToLink(this_subli, section_idx, subsection_idx);
                }
            this_li.appendChild(subsectionlist);
            }
            sectionlist.appendChild(this_li);
        }
        if(prestype=='default'){
            //This is for all the additional functionality such as inserting spontaneous text content, songs, bible slides etc
            //versepreview.appendChild(AddFunctionalitySection());
            if (updated == false){
                AddFunctionalitySection();
            }

            var linkheader = TagWithText("h3","Sisältö","hlpresentation");
            linkheader.id = 'defaultcontentheader';
            linkheader.addEventListener('click',SwitchToDefault,false);
            contentlist.appendChild(linkheader);

            contentlist.appendChild(sectionlist);


            if(updated==false){
                document.body.appendChild(navigatorcontainer);
                //document.body.style.overflow="auto";
            }
        }
        else{
            var container = document.getElementById('addedcontent');
            ClearContent(container);
            container.appendChild(sectionlist);
        }

    };

    /**
     *
     * Adds new content to the presentation. NOTE: at the moment
     * only works for a flat presentation, i.e. the presentation object for
     * spontaneous content.
     *
     * @param {ScreenContent} newcontent - a ScreenContent object (song, information slide, bible slide, header, image...)
     *
     */
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

    /**
     * A wrapper for inserting multiple songs (of the same type) into a structured
     * service.
     *
     * @param {string} songrole - the type, e.g. "Worship song" or "Communion song", of the songs to be inserted
     * @param {array} constantinfo - A {@link SectionItem} (usually of the type {@link InfoContent}). This is an array of exactly 3 items with the structure [name of content,  {@link ScreenContent} item, type of content ]
     *
     */
    this.MultiSong =function MultiSong(songrole, constantinfo){
        songs = [];
        var wscounter = 1;
        for(var songidx in this.songs[songrole]){
            var wsong = this.songs[songrole][songidx];
            wsong.songnumber = wscounter;
            songs.push(['Laulu: ' +  wsong.titletext, wsong, songrole]);
            if(constantinfo!==undefined){
                if (songidx < this.songs[songrole].length -1 ){
                    //Don't add the info after the last song
                    songs.push(['infodia', constantinfo, 'info']);
                }
            }
            wscounter++;
        }
        return songs
    }

    this.CreateKolehtiSlide = function(){
    
        this.kolehtislide =  new InfoContent('Tämän viikon kolehtikohde', ['Voit tulla ehtoolliselle jo Jumalan karitsa -hymnin aikana', 
                                                                       'Halutessasi voit jättää kolehdin ehtoolliselle tullessasi oikealla olevaan koriin.']);
    }

}

/**
 * Represents a pre-defined (hard-coded) worship service. 
 * This can be used as a model for making new specific
 * service types. This should only be a temporary solution, so 
 * that these hard-coded presentations would be replaced by
 * e.g. separate configuration files.
 *
 * @constructor
 *
 * @param {DOM document object} doc - the document element to be used (original vs. updated)
 *
 * @param {string} title - The title of the service. Retrieved from the html template.
 * @param {string} showtype - If multiple different structures, here's where to specify the right one
 *
 * @extends Presentation
 *
 */
function StructuredPresentation(doc, showtype){
    /** 
     *
     * Retrieves the names of the people involved in making this service from
     * the html template created by diat.php
     *
     * @param {DOM document} doc - where to fetch the information about the credits. Either from the actual document, or a separate updater document (check {@link })
     *
     */

    this.GetSongs(doc);
    this.showtype = showtype;

    if(showtype=="majakka"){
        //TODO: import this from structure html
        var credits1 = new CreditContent('', this.GetCredits(doc));
        var evankeliumi = new BibleContent(document.getElementById('evankeliumi').getAttribute('address'), document.getElementById('evankeliumi').textContent );
        //TODO: make creating these sections simpler
        //1. Collect all worship songs and make them into a section
        var communionsongs = this.MultiSong("Ehtoollislauluja");
        var ehtoollisinfo  = new InfoContent('Ehtoolliskäytännöistä', ['Voit tulla ehtoolliselle jo Jumalan karitsa -hymnin aikana', 
                                                                       'Halutessasi voit jättää kolehdin ehtoolliselle tullessasi oikealla olevaan koriin.',
                                                                       'Ehtoollisavustajana tänään ' + this.credits["Ehtoollisavustaja"]]);

        var rukouscredits = "Rukouspalvelijana tänään " + this.credits["Rukouspalvelu"] + ". ";
        //TODO: Hae esirukoilijatieto autom.
        var wsinfo  = new InfoContent('Ylistys- ja rukousosio', ['Ylistys- ja rukouslaulujen aikana voit kirjoittaa omia  rukousaiheitasi ja hiljentyä sivualttarin luona.', ' Rukouspalvelu hiljaisessa huoneessa. ' + rukouscredits]);
        //var worshipsongs = this.MultiSong("Ylistys- ja rukouslauluja", ['rukousinfo', wsinfo, 'info']);
        var worshipsongs = this.MultiSong("Ylistys- ja rukouslauluja", wsinfo);
        worshipsongs.push(['Esirukous',false,'header']);
        worshipsongs.unshift(['rukousinfo', wsinfo, 'info']);

        var johdanto = [['Krediitit1',credits1,'info'], ['Alkulaulu',this.songs['Alkulaulu'][0],'song'], ['Alkusanat',false,'header'], ['Seurakuntalaisen sana',false,'header']]

        this.credits["Pyhis"] = this.credits["Pyhis"].replace(" ","");
        if(this.credits["Pyhis"].toLowerCase()!=="ei"){
            //Jos on pyhis, lisää siitä infot
            var lapsicredits = "Pyhistä vetää tänään " + this.credits["Pyhis"] + ", klubissa " + this.credits["Klubi"];
            var info1 = new InfoContent('Lapsille ja lapsiperheille', ['Päivän laulun aikana 3-6-vuotiaat lapset voivat siirtyä pyhikseen ja yli 6-vuotiaat klubiin.', 'Seuraa vetäjiä - tunnistat heidät lyhdyistä!', lapsicredits]);
            johdanto.push(['Pyhisinfo',info1,'info']);
        }

        this.CreateKolehtiSlide();
        var self = this;

        //2. Combine all the sections
        this.items = [new Section(this, 'Johdanto', johdanto),
                      new Section(this, 'Sana',               [['Päivän laulu',this.songs['Päivän laulu'][0],'song'],
                                                              ['Evankeliumi',evankeliumi,'header'],
                                                              ['Saarna',false,'header'],
                                                              ['Synnintunnustus',false,'header'],
                                                              ['Uskontunnustus',new SongContent('', allsongs["uskontunnustus"].content),'song']]),
                      new Section(this, 'Ylistys ja rukous', worshipsongs),
                      new Section(this, 'Ehtoollisen asetus', [['Ehtoollisrukous2',self.kolehtislide,'info'],
                                                              ['Pyhä',this.songs['Pyhä-hymni'][0],'song'], 
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
    }
    else if(showtype=="parkki"){
        //In the simple case, just insert the songs directly as items
        var ohjeet = ["1. Raahaa tämä ikkuna esitysnäyttöön (varmista ensin, ettei näyttöjä ole peilattu, vaan että projektori on oma näyttönsä ja tietokoneen näyttö omansa)",
                       "2. Aseta tämä ikkuna koko näytön tilaan (useimmissa selaimissa F11-näppäin)",
                       "3. Paina nuolta oikealle tai klikkaa jotakin alkuperäisessä ikkunassa näkyvistä laulujen nimistä, niin esitys käynnistyy",
                       "4. Esityksessä liikutaan eteenpäin ja taaksepäin joko nuolinäppäimillä TAI sitten voit klikata laulujen nimiä ja niiden säkeistöjä"];
        this.items = [new InfoContent('Ohjeita laulujen näyttämiseen', ohjeet, 'Ohjeet diojen näyttäjälle')];
        for(idx in this.songs["song"]){
            var thissong = this.songs["song"][[idx]];
            thissong.items.unshift(thissong.titleslide.items[0]);
            thissong.pointer.max += 1;
            this.items.push(thissong);
        }
    }


    //mark the section idx for each of the sections TODO find a better way
    for(var sec_idx in this.items){
        this.items[sec_idx].sec_idx = sec_idx;
    }
    SetPointers(this, true);
    this.GetContentChain();

}

StructuredPresentation.prototype = new Presentation();
StructuredPresentation.prototype.constructor = StructuredPresentation;


/**
 * Pointers keep track of a set of contents in order to show them on the screen 
 * on the right moment. Classes {@link Presentation} and {@link ScreenContent}
 * have pointers. Basically, the simplest way to use a pointer is to move one slide
 * forward or backward in the presentation. The usefulness of pointers is best demonstrated,
 * when the presentation is a structured one, i.e. has nested contents. Having pointers as 
 * a separate class is what makes the presentation non-linear, i.e. makes jumping and linkking 
 * possible.
 *
 * @constructor
 *
 **/
function Pointer(pointed){
    this.max  = pointed.items.length;
    this.pointed = pointed;
    this.started = false;
    this.position = 0;
    /**
     *
     * Moves the pointer forward or backward, if possible.
     *
     * @param {string} movetype - "increment", "decrement" or "unchanged"
     *
     **/
    this.Move = function(movetype){
        var returnvalue = false;
        //Make sure the value is interpreted corretly after jumping from links etc
        this.position = parseInt(this.position);
        switch(movetype){
            case "increment":
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
                break;
            case "decrement":
                if(this.position -1 >= 0){
                    this.position--;
                    returnvalue = "decremented";
                }
                else{
                    returnvalue = false;
                }
                break;
            case "unchanged":
                returnvalue = "started";
                break;
            default:
                break;
        }

        //Set the parent object's currently active element
        if (this.pointed.hasOwnProperty('current')){
            this.pointed.current = this.pointed.items[this.position];
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

/**
 *
 * Represents the basic building block of a section.
 *
 * @constructor
 * @param {string} name - The title of the section item
 * @param {string} itemtype - "info", "Worship song" etc.
 *
 **/
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
        }
    }
    
    SetPointers(this, true);
}

/**
 *
 * The structured service consists of sections.
 *
 * @constructor
 *
 **/
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

    /**
     *
     * Prints a list of section names on the presentation screen and highlights
     * the current one.
     *
     **/
    this.PrintSectionName = function(){
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

/**
 *
 * This function is the target of the navigation links.
 * The function picks the target the user wants to jump to,
 * finds the relevant {@link ScreenContent} object and
 * trigger's the object's Show function
 *
 * 
 * @param {object}  evt - the event that fired the function
 *
 **/
function Mover(evt){

    //Change the active presentation 
    if (evt.target.parentNode.id=='addedcontent_sectionlist' & Presentations.current=='default'){
        SwitchToSpontaneous();
    }
    else if(evt.target.parentNode.id!='addedcontent_sectionlist' & Presentations.current!='default'){
        SwitchToDefault();
    }
    var currentpres = Presentations[Presentations.current];

    //-------------
    var targetcontent = undefined;
    //Mark the parent section of the target
    var sectiontarget = evt.target.getAttribute('sectionidx');

    currentpres.current = currentpres.items[sectiontarget];
    currentpres.pointer.started = true;
    currentpres.pointer.position = parseInt(sectiontarget);


    if (currentpres.showtype == 'majakka'){
        var secitemtarget = evt.target.getAttribute('secitemidx');
    }

    for (var section_idx in currentpres.items) {
        var thissection = currentpres.items[section_idx];
        if (section_idx < sectiontarget){
            if (currentpres.showtype=='majakka'){
                AdjustPointersFromSectionDown(thissection, 'max', undefined);
            }
            else{
                UpdatePointers(thissection, 'max');
            }
        }
        else if (section_idx == sectiontarget){
            if (currentpres.showtype=='majakka'){
                var targetcontent = AdjustPointersFromSectionDown(thissection, 'min', secitemtarget);
            }
            else{
                var targetcontent = thissection;
                //Flate presentations: always reset the song to its beginning
                UpdatePointers(thissection, 'min');
            }
        }
        else if (section_idx > sectiontarget){
            if (currentpres.showtype=='majakka'){
                AdjustPointersFromSectionDown(thissection, 'min', undefined);
            }
            else{
                UpdatePointers(thissection, 'min');
            }
        }
    }

    currentpres.GetContentChain();
    targetcontent.Show();
}



/**
 *
 *
 * This function is the target of the navigation links for jumping between
 * verses.   
 *
 * @param {object}  evt - the event (the target verse) that fired the function
 *
 **/
function VerseMover(evt){
    var tag = evt.target;
    var thispres = Presentations[Presentations.current];
    //Find the current song on display
    thispres.GetContentChain();
    if(Presentations.current == 'spontaneous' || Presentations.default.showtype !== "majakka"){
        //Songs in the spontaneous mode have no section titles
        var thissong = thispres.chain[thispres.chain.length-1];
    }
    else if (thispres.current.current.current.content_type=='sectiontitle'){
        //If the user has clicked on a verse before the song has begun
        //i.e. (only the sectiontitle of the song is active)
        //in this case the song is se second item of the items array
        var thissong = thispres.current.current.items[1];
        //Make sure the presentation updates its currently displayed item to be the song
        thispres.current.current.current = thissong;
        thispres.GetContentChain();
    }
    else{
        var thissong = thispres.chain[thispres.chain.length-1];
    }
    thissong.pointer.position = tag.getAttribute('pointerpos');
    while(thissong.pointer.position == undefined){
        tag = tag.parentNode;
        thissong.pointer.position = tag.getAttribute('pointerpos');
    }
    thissong.Show();
}

/**
 *
 * Represents a basic object, e.g. a song, an information slide, a header etc.,
 * that can be displayed on the screen. This is the very basic building block
 * of the presentation.
 *
 * @constructor
 *
 **/
function ScreenContent(){
    this.custombg="";
    this.content_type = "";
    this.items = [];
    /**
     *
     * Prints the content on the screen
     *
     **/
    this.Show = function(){
        
            

            PresScreen = Presentations.screen;
            //1. Clear the layout of the screen
            //TODO: only do this when necessary
            PresScreen.Refresh();
            //2. make shure the item is shown only once
            this.pointer.started = true;

            switch (this.content_type){ 
                case "song":
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer.position],'song');
                    //Set what's seen in the navigator screen
                    break;
                case "sectiontitle":
                    sitem = this.mysection.current;
                    PresScreen.UpdateContent('sections',this.mysection.PrintSectionName(),'headers');
                    PresScreen.UpdateContent('sitems',this.mysection.CreateLeftbanner(this.mysection.pointer.position),'headers');
                    if (sitem.itemtype=='song'){
                        //Consider removing the itemtype prop!
                        //Insert the song's title as a content on the right of the screen
                        //Songs as sectionitems are always of the format:
                        //[sectiiontitle, song]
                        //this is why items[1]
                        //TODO: lyrics by, music by...
                    }
                    //Adjust the Section headings to the center
                    AdjustHeadings(PresScreen);

                    // Update the tracker. TODO only do this if wanted:
                    if(this.mysection.current.itemtype=="Ylistys- ja rukouslauluja"){
                        UpdateTracker("ylistyslaulu"+this.mysection.current.items[1].songnumber);
                    }
                    else if(this.mysection.current.itemtype=="Ehtoollislauluja"){
                        UpdateTracker("ehtoollislaulu"+this.mysection.current.items[1].songnumber);
                    }
                    else{
                        //Muut laulut yms. identifioidaan tyypin mukaan
                        UpdateTracker(this.mysection.current.name);
                    }
                    break;
                case "info":
                    //Think about songtitles also as not part of a special sectioned service
                    PresScreen.UpdateContent('infobox',this.items[this.pointer.position],'info');
                    break;
                case "credits":
                    //Think about songtitles also as not part of a special sectioned service
                    PresScreen.UpdateContent('creditbox',this.items[this.pointer.position],'info');
                    break;
                case "bibletime":
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer.position],'bible');
                    break;
                default:
                    PresScreen.UpdateContent('textcontent',this.items[this.pointer.position],'info');
                    break;
            }
            //Add or remove content from te navigator
            this.UpdatePreview();
            //Make sure the presentation is the screen that is currently visible
            //Presentations.screen.preswindow.focus();

            if(Presentations.screen.blankscreenactive){
                //Make sure that the blank screen stays active if turned on
                var div = TagWithText("div","","blankscreen");
                div.id = "blankbox";
                Presentations.screen.doc.getElementById('prescont').appendChild(div);
            }
            
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
        //prevsec.appendChild(AddFunctionalitySection());
        //AddFunctionalitySection();
        if(!this.hasOwnProperty("mysection")){
            var content_type = this.content_type;
        }
        else if(this.mysection.current.items.length>1 & this.content_type=='sectiontitle'){
            if(['song','bibletime'].indexOf(this.mysection.current.items[1].content_type)>-1){
                //If this is a title for a song i.e. the next item to be shown will be a song
                content_type = 'song';
                var song = this.mysection.current.items[1];
            }
        }
        switch (content_type){ 
            //If this is a song, update the preview window
            //TODO: add something for other types as well
            case "song":
            case "bibletime":
                var verselist = CreateTag("div","", document, "previewedverses");
                if(['song','bibletime'].indexOf(this.content_type)>-1){
                    var song = this;
                }
                for (var verse_idx in song.items){
                    var thisverse = song.items[verse_idx].cloneNode(true);
                    thisverse.setAttribute('pointerpos',verse_idx);
                    thisverse.addEventListener('click',VerseMover,false);
                    //ListToLink(this_li, section_idx, 0);
                    //highlight the current:
                    if (verse_idx == song.pointer.position){
                        if(['song','bibletime'].indexOf(this.content_type)>-1){
                            //only highlight zero if the song has actually been  started
                            thisverse.className = 'hlverse';
                        }
                    }
                    verselist.appendChild(thisverse);
                }
                prevsec.appendChild(verselist);
                break;
            default:
                var link = TagWithText("a","Seuraava dia >>","");
                link.addEventListener('click', NextSlide, false);
                document.getElementById("previewer").appendChild(TagParent("div",[link]));
            break;
        }
        //document.body.style.overflow="auto";
    };
}


/**
 *
 * Fixes the layout of the headers by slightly adjusting the height and margin
 * of the elements.
 *
 * @param {object}  screen -  a {@link Screen} object
 *
 **/
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


/**
 *
 * 
 * Songs are stored in SongContent objects.
 *
 *
 * @constructor
 * @extends ScreenContent
 *
 **/
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

/**
 *
 * Represents the slide containing the title of the song.
 * Notice, that the songs' titles are not a part of the 
 * {@link SongContent} objects' items array, but rather a separate object,
 * linked to the song by the songs "titleslide" porperty.
 *
 *
 * @constructor 
 * @param {string} title - the text that is displayed as the songs title
 * @property {string} className - the text displayed
 *
 */
function SongTitleContent(title){
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
    this.mysection = section;
    this.content_type = "sectiontitle";
    this.items = [];
    SetPointers(this, false);
    return 0;
}
SectionTitleContent.prototype = new ScreenContent();
SectionTitleContent.prototype.constructor = SectionTitleContent;

function CreditContent(headertext, infotext, content_name){
    this.content_type="credits";
    if (content_name!==undefined){
        this.name = content_name;
    }

    var div = document.createElement('div');
    var body = document.createElement('ul');
    body.className = "infolist";
    for (var info_id in infotext){
        if(info_id.trim() !==""){
            // Jos asetettu
            var this_li = document.createElement('li');
            this_li.textContent = infotext[info_id];
            body.appendChild(this_li);
        }
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


/**
 *
 * This is a specific type of {@link ScreenContent}, used for presenting simple
 * textual information on the screen.
 *
 * @constructor
 * @extends ScreenContent
 *
 **/
function InfoContent(headertext, infotext, content_name){
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

//Remove by id:
//http://stackoverflow.com/questions/3387427/remove-element-by-id
Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function SetPointers(object, setcurrent){
    object.pointer = new Pointer(object);
    if (setcurrent){
        //The "current" property is not set for Sectiontitlecontent etc
        object.current = object.items[0];
    }
}



function GetSongs(doc){
    //Fetch the songs from  the html file

    var songs = {};

    var songdivs = doc.getElementsByClassName("songdata");
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



/**
 *
 *
 * Represents the browser window where the actual slides are shown.
 *
 * @constructor
 *
 **/
function Screen(newwindow){

    /**
     *
     * Use the structure-containing html document to retrieve information
     * about styles the user has chosen
     *
     */
    this.GetStyles = function(){
        //this.backgrounds = {"headers":{"url":"htmlslides/images/pp_logo_400.png","position":"top right"},
        //                    "info":{"url":"htmlslides/images/pp_logo_400.png","position":"top right"},
        //                    "song":{"url":"htmlslides/images/pp-stripe_1800.png","position":"top left"},
        //                    "bible":{"url":"htmlslides/images/sulka_300.png","position":"bottom right"}};
        var imgurl ="htmlslides/images/lh_2.png";
        //var imgurl ="htmlslides/images/lh_2_dark.png";
        this.backgrounds = {"headers":{"url":imgurl,"position":"center center fixed"},
                            "info":{"url":imgurl,"position":"center center fixed"},
                            "song":{"url":imgurl,"position":"center center fixed"},
                            "bible":{"url":imgurl,"position":"center center fixed"}};
    }

    /**
     *
     * Applies presentation specific styles, such as the background of the show
     * etc.
     *
     * @param {string} styletype - Whether the screen will contain lyrics, info etc..
     *
     **/
    this.SetStyles = function(styletype){
        //background: url('htmlslides/images/lh_2.png') no-repeat center center fixed;
        this.doc.body.style.color="black";
        var bbsetter = document.getElementById("useblackbg");
        if (bbsetter.checked==true){
            this.prescont.style.backgroundImage = "none";
        }
        else{
            this.prescont.style.backgroundImage = "url('" +  this.backgrounds[styletype].url + "')";
        }
        this.prescont.style.backgroundPosition = this.backgrounds[styletype].position;
        this.prescont.style.backgroundSize = "auto";
        this.prescont.style.backgroundSize = "inherit";
        if(styletype=="song"){
            //this.prescont.style.paddingTop = "156px";
        }
        else{
            this.prescont.style.paddingTop = "0px";
        }

        if(this.backgrounds[styletype].url.indexOf("pp_logo_400")>-1){
            //this.prescont.style.backgroundPosition = this.backgrounds[styletype].position;

            //Determine maximum size for background
            
            //1. Determine, which element present
            var possibleboxes = [this.sitems, this.creditbox, this.infobox];
            for(i=0; i<possibleboxes.length;i++){
                var thisbox = possibleboxes[i];
                var rect = thisbox.getBoundingClientRect();
                if(rect.right>0){
                    break;
                }
            }
            var spaceforlogo = this.doc.body.offsetWidth-rect.right;
            if (spaceforlogo < 410){
                this.prescont.style.backgroundSize = (spaceforlogo - 10) + "px " + (spaceforlogo - 10) + "px";
            }
            //commentdiv.style.top = rect.top + 5 + "px";
        }
    }

    /**
     *
     * Empties the contents of the presenter screen.
     *
     **/
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

    /**
     *
     * Attaches content to the presenter screen by converting the content items
     * to the specified html elements.
     *
     * @param {string} divname - the name  of the target object where the content will be placed
     * @param {html DOM object} contentitem - the content to be shown. This can be a verse, the text of an info slide etc. The elements are HTML nodes.
     *
     **/
    this.UpdateContent = function(divname, contentitem, styletype){
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
        this.SetStyles(styletype);
    }



    var thisdocument = newwindow.document;
    this.preswindow = newwindow;

    this.bgdiv = CreateTag("div", "bgdiv", thisdocument);

    this.prescont = CreateTag("div", "prescont", thisdocument);
    this.navwrapper = CreateTag("section", "navwrapper", thisdocument,"",this.prescont);
    this.navcontainer = CreateTag("section", "navcontainer", thisdocument,"",this.navwrapper);
    this.textcontent = CreateTag("div", "textcontent", thisdocument);
    this.heading = CreateTag("nav", "heading", thisdocument);
    this.infobox = CreateTag("div", "infobox", thisdocument);
    this.creditbox = CreateTag("div", "creditbox", thisdocument);

    var heading = CreateTag("h2", "", thisdocument, "",this.heading);
    heading.textContent = Presentations.default.maintitle;
    var subheading = CreateTag("h3", "", thisdocument, "",this.heading);
    subheading.textContent = Presentations.default.title;

    this.sections = CreateTag("nav", "sections", thisdocument);
    this.sitems = CreateTag("nav", "sitems", thisdocument);
    this.itemtitle = CreateTag("div", "itemtitle", thisdocument);
    this.doc = thisdocument;
    this.blankscreenactive = false;

    //For the navigation window
    this.sectionlinks = CreateTag("div", "sectionlinks", thisdocument);

    thisdocument.body.appendChild(this.bgdiv);
    thisdocument.body.appendChild(this.prescont);

    this.GetStyles();
    this.SetStyles("headers");

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
    preswindow.document.write('<html lang="fi" style="background:black;" ><head><link href="https://fonts.googleapis.com/css?family=Nothing+You+Could+Do|Quicksand" rel="stylesheet"> <meta http-equiv="Content-Type" content="text/html" charset="UTF-8"><link id="stylesetter" rel="stylesheet" type="text/css" href="htmlslides/tyylit2.css?id=assdsd22sdsd22dasd98798"/></head><body></body>');
    ClearContent(preswindow.document.body);
    ////TODO:this is the key to make separate screen working!
    Presentations.screen = new Screen(preswindow);
    preswindow.onkeydown = checkKey;
    document.onkeydown = checkKey;
    //Move to the first actual slide
    //Presentations.default.Move('increment');
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
    if (stylesetter.href!=='htmlslides/tyylit.css?id=2e2e'){
        stylesetter.href = "htmlslides/tyylit2.css?id=2e2e";
    }
    else{
        stylesetter.href = "htmlslides/tyylit2.css?id=2e2e";
    }

}

/**
 *
 * Creates the functionality for adding spontaneous content and for some other
 * functions such as the second browser functionality.
 *
 **/
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


    var bslink = TagWithText("a","Avaa toinen selain","");
    var bsurl = TagParent("input",[],"","bsurl");
    bslink.id = "sbrowserlink";
    bsurl.setAttribute("type","text");
    bsurl.setAttribute("placeholder","kirjoita Internet-osoite");
    bsurl.id="bsurl";
    bslink.addEventListener('click', AddSecondBrowser, false);
    var browsersec = TagParent("section",[bsurl, bslink, TagWithText("p","(palaa esitykseen klikkaamalla mitä tahansa otsikkoa)")],"functionalsection","browsersec");

    var blackbox = TagWithText("input","Käytä täysin mustaa taustaa","");
    blackbox.id="useblackbg";
    blackbox.type="checkbox";
    var bbsec = TagParent("section",[blackbox,TagWithText("span","Kätä täysin mustaa taustaa")],"functionalsection","bbsec");

    var timerbox = TagWithText("input","","");
    timerbox.id="timerval";
    timerbox.type="text";
    var timerbut = TagWithText("button","Aloita ajastin","");
    timerbut.id="timerbut";
    timerbut.addEventListener('click', ControlTimer, false);
    var timerbut2 = TagWithText("button","Nollaa ajastin","");
    timerbut2.id="timerreset";
    timerbut2.addEventListener('click', ResetTimer, false);

    var timerlink = TagWithText("a","Lisää","");
    timerlink.addEventListener('click', AddTimer, false);
    var timersec = TagParent("section",[TagWithText("span","Ajastin"),timerbox,timerbut,timerbut2,timerlink],"functionalsection","timersec");


    //var blink = TagWithText("a","Blank screen");
    //var utilities = TagParent("section",[blink],"functionalsection","utsection");
    //utilities.addEventListener('click', BlankScreen, false);

    //var stylelink = TagWithText("a","Suurenna fonttia");
    //stylelink.id = "fontplus";
    //stylelink.addEventListener('click', FontIncrease, false);
    //var stylelink2 = TagWithText("a","Pienennä fonttia");
    //stylelink2.id = "fontminus";
    //stylelink2.addEventListener('click', FontIncrease, false);
    //var stylesec = TagParent("section",[TagParent("span",[stylelink]),TagParent("span",[stylelink2])],"functionalsection","stylesec");


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

    var hiddenfunctions = TagParent("section",[textcontsec, songcontsec, bibcontsec, embcontsec, browsersec, bbsec, timersec],"functions_section");
    hiddenfunctions.id = "hiddenfunctions";
    document.getElementById("functionalmenu").appendChild(hiddenfunctions);
    //return TagParent("section",[utilities],"functions_section");
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


function checkUpdaterframeLoaded() {
    //http://stackoverflow.com/questions/9249680/how-to-check-if-iframe-is-loaded-or-it-has-a-content
    var iframe = document.getElementById('updaterframe');
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (  iframeDoc.getElementById('updatecompleted')  !== null) {
        GetUpdatedStructure();
        document.getElementById('logger').textContent = '';
        return;
    } 
    var previewer = document.getElementById("previewer");
    ClearContent(previewer);
    previewer.appendChild(TagWithText("p","Ladataan päivitystä...",""));
    window.setTimeout('checkUpdaterframeLoaded();', 500);
}

/**
*
* Fetch the updated service structure from the iframe loaded by 
* {@link UpdateStructure} and {@link checkUpdaterframeLoaded}
*
**/
function GetUpdatedStructure(){
    var newdoc = document.getElementById('updaterframe').contentWindow.document;
    //Update the list of songs...
    allsongs = GetSongs(newdoc);
    Presentations.default = new StructuredPresentation(newdoc, "majakka");
    Presentations.default.GetContentChain();
    //Remove the old navigation elements
    ClearContent(document.getElementById("section_nav"));
    Presentations.default.CreateNavigation("default");
    ClearContent(document.getElementById("previewer"));
    //empty the contents to make further updates possible:
    var frame = document.getElementById("updaterframe");
    frame.src = 'empty.html' ;
    //Start the presentation again from the start
    thisobject = Presentations.default;
    while(typeof thisobject.Show === 'undefined'){
        //Iterating down to first showable content
        thisobject = thisobject.current;
    }
    thisobject.Show();
    Presentations.default.GetContentChain();
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
    document.getElementById('logger').textContent = 'Ladataan sisältöä, odota hetki';
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

function AddTimer(){
    var sp1 = TagWithText("span","00","");
    sp1.id = "min";
    var sp2 = TagWithText("span","00","");
    sp2.id = "sec";
    var timerdiv = TagParent("div",[sp1,TagWithText("span",":",""),sp2]);
    timerdiv.id="timerdiv";
    Presentations.spontaneous.AddContent(new EmbeddedContent(timerdiv, "Ajastin"));
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



function IncreasePresFont(){
    //Presentations.screen.preswindow.document.body.style.fontSize="400%";
}

function DecreasePresFont(){
    //Presentations.screen.preswindow.document.body.style.fontSize="400%";
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

function FontIncrease(link){
    var fs = Presentations.screen.doc.body.style.fontSize;

    if (link.id == "fontplus"){
        if(fs==""){
            Presentations.screen.doc.body.style.fontSize="110%";
        }
        else{
            var percentage =  fs.substr(0, fs.indexOf("%")) * 1;
            Presentations.screen.doc.body.style.fontSize = (percentage + 10) + "%";
        }
    }
    if (link.id == "fontminus"){
        if(fs==""){
            Presentations.screen.doc.body.style.fontSize="90%";
        }
        else{
            var percentage =  fs.substr(0, fs.indexOf("%")) * 1;
            Presentations.screen.doc.body.style.fontSize = (percentage - 10) + "%";
        }
    }
}

function AddSecondBrowser(){

    try{
    var address = document.getElementById("bsurl").value;
    }
    catch(error){
        address = "";
    }
    if(address.indexOf("http://")==-1 &&  address.indexOf("https://")==-1 && address != ""){
        address = "http://" + address;
    }
    if(Presentations.secondbrowser == null){
        Presentations.secondbrowser = window.open(address,'_blank', 'toolbar=0,location=0,menubar=0');
        document.getElementById('sbrowserlink').textContent = "Toinen selainikkuna esiin";
        document.getElementById('bsurl').outerHTML="";
    } 
    else{
        //if(address!=Presentations.secondbrowser.location){
            //Presentations.secondbrowser.location = address;
        //}
        Presentations.secondbrowser.focus();
    }

}

/**
*
 * Opens the functional menu on the top bar. The functional menu contains 
 * controls mainly for adding spontaneous content such as songs or bible verses
 * not mentioned in the predefined service manuscript. The actual functionality
 * of the menu is created by function {@link AddFunctionalitySection}
 *
 **/
function OpenFunctionMenu(){
    var section = document.getElementById('functionalmenu');
    var h = window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0;
    var newheight = h;
    section.style.marginTop = document.getElementById('leftbanner').offsetHeight;
    if (section.style.height == '' || section.style.height == '0px'){
        section.style.height= newheight + "px";
        document.getElementById('openfunctlink').style.background = 'white';
        document.getElementById('openfunctlink').style.color = 'black';
        document.getElementById('hiddenfunctions').style.display = 'block';
    }
    else{
        document.getElementById('hiddenfunctions').style.display = 'none';
        section.style.height = "0px";
        document.getElementById('openfunctlink').style.background = 'none';
        document.getElementById('openfunctlink').style.color = 'white';
    }
}

//========================================

/**
 *
 * This function is rarely used. The only purpose is to provide a target for the 
 * "Next slide" -link displayed on the navigator.
 *
 **/
function NextSlide(){
        Presentations[Presentations.current].Move('increment');
}

/**
 *
 * Cover the presentation screen with a black box to hide the presentation.
 *
 **/
function BlankScreen(){
    var bsbutton = document.getElementById("blanklink");
    if (Presentations.screen.blankscreenactive == true){
        Presentations.screen.doc.getElementById('blankbox').remove();
        //Presentations.screen.doc.getElementById('blankbox').style.display="none";
        Presentations.screen.blankscreenactive = false;
        bsbutton.style.background = "white";
        bsbutton.style.color = "black";
        Presentations.screen.blankscreenactive = false;
    }
    else{
        var div = TagWithText("div","","blankscreen");
        div.id = "blankbox";
        Presentations.screen.doc.getElementById('prescont').appendChild(div);
        bsbutton.style.background = "black";
        bsbutton.style.color = "white";
        Presentations.screen.blankscreenactive = true;
    }
}

function UpdateTracker(identifier){
    var biblenavi = document.getElementById("biblenavi");
    try{
        ClearContent(biblenavi.contentWindow.document);
    }
    catch(error){
        console.log('problem with tracker..');
    }
    try{
        biblenavi.src = 'updatetracker.php?identifier=' + identifier;
        console.log("Updated the tracker...");
    }
    catch(error){
        console.log('Unable to update the tracker (=no such file as kulku.php).');
    }
        //checkIframeLoaded();
//    catch (error) {
//      alert("Raamattusisällön lisääminen toimii vain palvelimelta ajattuna (vähintään localhost)");
//      return false;
//    }


}


/**
 * Loads a separate php script (updater.php) on a hidden iframe in order
 * to check, whether the structure/content of the service has been changed.
 * If changes have occured, updates the javascript representation of structure
 * (the {@link Presentation} object) . Also updates the navigator screen 
 *
 **/
function UpdateStructure(){
    var frame = document.getElementById("updaterframe");
    frame.src="";
    //ClearContent(frame.contentWindow.document);
    var id = window.location.search.substring(window.location.search.search("id=")+3);
    frame.src = 'updatestructure.php?id=' + id;
    checkUpdaterframeLoaded();
}


function ResetTimer(evt){
    document.getElementById("timerbut").textContent = "Aloita ajastin";
    document.getElementById("timerval").value = "0";
}

function ControlTimer(evt){
        switch(evt.target.textContent){
            case "Aloita ajastin":
                var val = document.getElementById('timerval');
                timer = new Clock(val.value * 1);
                timer.start();
            case "Jatka ajastinta":
                evt.target.textContent = "Pysäytä ajastin";
                timer.resume();
                break;
            case "Pysäytä ajastin":
                evt.target.textContent = "Jatka ajastinta";
                timer.pause();
                break;
        }
}

Clock = function (mins){
    this.totalSeconds = mins * 60;
    this.start = function(){
            var self = this;
            var min = Presentations.screen.doc.getElementById('min');
            var sec = Presentations.screen.doc.getElementById('sec');
            min.textContent = Math.floor(self.totalSeconds / 60 % 60);
            sec.textContent = parseInt(self.totalSeconds % 60);
            this.interval = setInterval(function(){
                self.totalSeconds-=1;
                if(self.totalSeconds>-1){
                    var min = Presentations.screen.doc.getElementById('min');
                    var sec = Presentations.screen.doc.getElementById('sec');
                    min.textContent = Math.floor(self.totalSeconds / 60 % 60);
                    sec.textContent = parseInt(self.totalSeconds % 60);
                }
                }, 1000);
    } 

    this.pause = function () {
        clearInterval(this.interval);
        delete this.interval;
    }

    this.resume = function () {
        if (!this.interval) this.start();
    }
}

//========================================


//If a new document opened, these variables take care of it
var preswindow = undefined;
var allsongs = GetSongs(document);



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
