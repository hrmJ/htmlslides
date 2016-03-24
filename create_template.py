import glob
#Go through a list of txt files containing songs and produce an output html 
#Another alternative is to write the data as a js file
songpath = '/home/juho/Dropbox/laulut/*.txt'
htmlfile = """
<html lang="fi">
<head>
<meta http-equiv="Content-Type" content="text/html" charset="UTF-8">
<link rel="stylesheet" type="text/css" href="tyylit.css"/>
</head>
<title>Majakkamessu</title>
<body>
<div id='test'>
</div>
"""
jsfile = "var songs = {"
for songfile in glob.glob(songpath):
    with open(songfile,"r") as f:
        wholetext = f.read().splitlines()
    text = "\n".join(wholetext[1:]).strip()
    prefix = "\n<div id='{}' class='songdata'>\n".format(wholetext[0])
    htmlfile += "{}{}\n</div>\n\n".format(prefix,text)

htmlfile += """<script src="presenter.js"></script>
</body>\n</html>"""
jsfile += "};"

with open("template.html","w") as f:
    f.write(htmlfile.strip())

