import glob
import re
import menus
from difflib import SequenceMatcher


class Song():
    def __init__(self, songfile):
        with open(songfile,"r") as f:
            wholetext = f.read().splitlines()
        text = "\n".join(wholetext[1:]).strip()
        exp = re.compile(r'\/([^\.\/]+)\.')
        m = exp.search(songfile)
        self.name = m.group(1)
        #prefix = "\n<div id='{}' class='songdata'>\n".format(wholetext[0].strip())
        prefix = "\n<div id='{}' class='songdata'>\n<span class='songtitle'>{}</span>\n".format(self.name,wholetext[0].strip())
        self.html = "{}\n<p class='songdatacontent'>{}</p></div>\n\n".format(prefix,text) 

def CheckAvailability(songname, allnames):
    """Check if this song is in the db and try to guess if not"""
    songname = songname.lower()

    if songname not in allnames:
        suggestions = dict()
        for name in allnames:
            simratio = SequenceMatcher(None, songname, name).ratio()
            suggestions[simratio] = name
        ratios = sorted(suggestions.keys())
        ratios = ratios[-10:]
        ratios = sorted(ratios[-10:],reverse=True)
        suglist = dict()
        for idx, ratio in enumerate(ratios):
            suglist[str(idx)] = suggestions[ratio]
        suglist['n'] = 'ei mikään näistä'
        fuzzymenu = menus.multimenu(suglist, promptnow = 'Vastaako jokin näistä haettavaa laulua ({})?'.format(songname))
        if fuzzymenu.answer != 'n':
            return suglist[fuzzymenu.answer]
        else:
            sys.exit('Song "{}" not found. Exiting.'.format(songname))
        print('False')

    return songname

def StructureToHtml(songs):
    """Create a html string containing the service structure"""
    pass

def AddToStructureList(thislist,structure,pattern, role, isList = False):
    match = re.search(pattern,structure)
    if isList:
        #import ipdb; ipdb.set_trace()
        thislist.append([role, match.group(1).splitlines()])
    else:
        thislist.append([role, match.group(1).strip()])

def ExtractStructure(mailfile, allsongnames):
    """Use a txt file to get a standard structure of a predefined service"""
    with open(mailfile,'r') as f:
        structure = f.read()

    songs = list()
    AddToStructureList(songs,structure,r'Alkulaulu: ?(.*)','Alkulaulu')
    AddToStructureList(songs,structure,r'Päivän laulu: ?(.*)','Päivän laulu')
    AddToStructureList(songs,structure,r'Ylistyslaulut.*\n ?--+\n(([a-öA-Ö].*\n)+)','Ylistys- ja rukouslauluja',True)
    AddToStructureList(songs,structure,r'Pyhä-hymni: ?(.*)','Pyhä-hymni')
    AddToStructureList(songs,structure,r'Jumalan karitsa: ?(.*)','Jumalan karitsa')
    AddToStructureList(songs,structure,r'Ehtoollislaulut.*\n ?--+\n(([a-öA-Ö].*\n)+)','Ehtoollislauluja',True)
    AddToStructureList(songs,structure,r'Loppulaulu: ?(.*)','Loppulaulu')


    htmldata = "<div id='structure'>"
    for song in songs:
        if not isinstance(song[1],list):
            song[1] = CheckAvailability(song[1], allsongnames)
            htmldata += "\n<song role='{}'>{}</song>".format(song[0],song[1])
        else:
            #ylistslaulut, ehtoollislaulut are lists that contain many song names
            newsongnames = list()
            for thissongname in song[1]:
                thissongname = CheckAvailability(thissongname, allsongnames)
                newsongnames.append(thissongname)
                htmldata += "\n<song role='{}'>{}</song>".format(song[0],thissongname)
            songs[1] = newsongnames
    htmldata += "</div>"

    return htmldata

def CreateHtmlTemplate(songpath = '/home/juho/Dropbox/laulut/*.txt', servicestructure=None):
    """Go through a list of txt files containing songs and produce an output html 
    Another alternative is to write the data as a js file"""

    #Change this so that it uses real DOM instead of strings!
    htmlfile = """
    <html lang="fi">
    <head>
    <meta http-equiv="Content-Type" content="text/html" charset="UTF-8">
    <link rel="stylesheet" type="text/css" href="tyylit.css"/>
    </head>
    <title>Majakkamessu</title>
    <body>
    """
    #jsfile = "var songs = {"
    songs = list()
    allsongnames = list()
    songhtml="<div id='songs'>"
    for songfile in glob.glob(songpath):
        songs.append(Song(songfile))
        allsongnames.append(songs[-1].name.lower())
        songhtml += songs[-1].html

    songhtml += "</div>"

    if servicestructure:
        htmlfile += "\n" + ExtractStructure(servicestructure, allsongnames) + "\n"

    startlink = "<a href='#' onClick='OpenPres();'>Start</a>"
    htmlfile += songhtml + "\n<script src='presenter.js'></script>\n</body>\n</html>"
    #jsfile += "};"

    with open("template.html","w") as f:
        f.write(htmlfile.strip())


CreateHtmlTemplate(servicestructure="tests/teststructure.txt")
