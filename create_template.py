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


def ExtractStructure(mailfile, allsongnames):
    """Use a txt file to get a standard structure of a predefined service"""
    with open(mailfile,'r') as f:
        structure = f.read()

    songs = dict()

    match = re.search(r'Alkulaulu: ?(.*)',structure)
    songs['alkulaulu'] = match.group(1).strip()

    match = re.search(r'Päivän laulu: ?(.*)',structure)
    songs['paivanlaulu'] = match.group(1).strip()

#    match = re.search(r'evankeliumi: ?(.*)',structure.lower())
#    if match:
#        address = match.group(1).strip()
#        match = re.search(r'(\d?\w+) (\d+):([0-9,-]+)',structure.lower())
#        book = match.group(1)
#        chapter = match.group(2)
#        verse = match.group(3)
#        evankeliumi = BibleText(book,chapter,verse,address)
#
    match = re.search(r'Ylistyslaulut.*\n ?--+\n(([a-öA-Ö].*\n)+)',structure)
    ylistyslaulut = match.group(1)
    songs['ylistyslaulut'] = ylistyslaulut.splitlines()

    match = re.search(r'Ehtoollislaulut.*\n ?--+\n(([a-öA-Ö].*\n)+)',structure)
    ehtoollislaulut = match.group(1)
    songs['ehtoollislaulut'] = ehtoollislaulut.splitlines()

    match = re.search(r'Pyhä-hymni: ?(.*)',structure)
    songs['pyha'] = match.group(1).strip()

    match = re.search(r'Jumalan karitsa: ?(.*)',structure)
    songs['jumalankaritsa'] = match.group(1).strip()

    match = re.search(r'Loppulaulu: ?(.*)',structure)
    songs['loppulaulu'] = match.group(1).strip()

    for songrole, songname in songs.items():
        if songrole not in ('ylistyslaulut','ehtoollislaulut'):
            songs[songrole] = CheckAvailability(songname, allsongnames)
        else:
            #ylistslaulut, ehtoollislaulut are lists that contain many song names
            newsongnames = list()
            for thissongname in songname:
                newsongnames.append(CheckAvailability(thissongname, allsongnames))
            songs[songrole] = newsongnames

    cont = menus.multimenu({'y':'yes','n':'no'}, 'All songs found in the database. Create slides?')
    if cont.answer == 'y':
        pass
        #LuoMessu(songs, evankeliumi)

def CreateHtmlTemplate(songpath = '/home/juho/Dropbox/laulut/*.txt', servicestructure=None):
    """Go through a list of txt files containing songs and produce an output html 
    Another alternative is to write the data as a js file"""

    htmlfile = """
    <html lang="fi">
    <head>
    <meta http-equiv="Content-Type" content="text/html" charset="UTF-8">
    <link rel="stylesheet" type="text/css" href="tyylit.css"/>
    </head>
    <title>Majakkamessu</title>
    <body>
    <div id='screen1'>
    </div>
    """
    #jsfile = "var songs = {"
    songs = list()
    allsongnames = list()
    songhtml=""
    for songfile in glob.glob(songpath):
        songs.append(Song(songfile))
        allsongnames.append(songs[-1].name.lower())
        songhtml += songs[-1].html

    if servicestructure:
        ExtractStructure(servicestructure, allsongnames)


    htmlfile += songhtml + "\n<script src='presenter.js'></script>\n</body>\n</html>"
    #jsfile += "};"

    with open("template.html","w") as f:
        f.write(htmlfile.strip())


CreateHtmlTemplate(servicestructure="teststructure.txt")
