<?php

function FormUrl($book, $chapter){
    return  "http://raamattu.fi/1992/$book.$chapter.html";
}

function StripRaamattuHtml($html){
    $html = mb_substr($html, mb_strpos($html, "<hr>")+4,-1);
    $html = mb_substr($html, 0, mb_strpos($html, "<hr>"));
    return $html;
}


function GetHtml($origin){
    $content = file_get_contents($origin);
    $html =  mb_convert_encoding($content, 'UTF-8', mb_detect_encoding($content, 'UTF-8, ISO-8859-1', true));
    $html = StripRaamattuHtml($html);
    $pageDom = new DomDocument();    
    $searchPage = mb_convert_encoding($html, 'HTML-ENTITIES', "UTF-8"); 
    @$pageDom->loadHTML($searchPage);
    return $pageDom;
}

function GetHeaders($pageDom){
    $headers = $pageDom->getElementsByTagName('h4');
    $headers2 = $pageDom->getElementsByTagName('h2');
    $headertexts = Array();
    foreach ($headers as $header) {
        $headertexts[]= $header->textContent;
    }
    foreach ($headers2 as $header) {
        $headertexts[]= $header->textContent;
    }
    return $headertexts;
}


function AddVerseContent($versenumber, $verselist, $content){
    $content .= " ";
    if(array_key_exists($versenumber,$verselist)){
        $verselist[$versenumber] .= $content;
    }
    else{
        $verselist[$versenumber] = $content;
    }
    return $verselist;
}


function FetchBibleContent($chapteraddress, $verseaddress,$onbackground){
    $booknames = Array('Matt', 'Mark', 'Luuk', 'Joh', 'Apt', 'Room', '1Kor', '2Kor', 'Gal', 'Ef', 'Fil', 'Kol', '1Tess', '2Tess', '1Tim', '2Tim', 'Tit', 'Filem', 'Hepr', 'Jaak', '1Piet', '2Piet', '1Joh', '2Joh', '3Joh', 'Juud', 'Ilm','1Moos', '2Moos', '3Moos', '4Moos', '5Moos', 'Joos', 'Tuom', 'Ruut', '1Sam', '2Sam', '1Kun', '2Kun', '1Aik', '2Aik', 'Esra', 'Neh', 'Est', 'Job', 'Ps', 'Sananl', 'Saarn', 'Laull', 'Jes', 'Jer', 'Valit', 'Hes', 'Dan', 'Hoos', 'Joel', 'Aam', 'Ob', 'Joona', 'Miika', 'Nah', 'Hab', 'Sef', 'Hagg', 'Sak', 'Mal');
    if(preg_match("(" . implode($booknames,"|") . ")", $chapteraddress)==0 and !$onbackground){
        echo "<script>alert('Raamattuosoite " . $chapteraddress . " ei kelpaa. Hyväksytyt kirjojen lyhenteet ovat: " . implode($booknames,", ") . " ')</script>";
        return "Raamatuntekstiä ei löytynyt. Sori siitä! (niin kuin sanonta kuuluu).";
    }
    $pageDom = GetHtml("http://raamattu.fi/1992/" . $chapteraddress . ".html");
    $headertexts = GetHeaders($pageDom);
    foreach ($pageDom->childNodes as $item){
        $text = $item->textContent;
        //FIX!^^
    }

    $textcont="";
    foreach(preg_split("/((\r?\n)|(\r\n?))/", $text) as $line){
        if(!in_array($line,$headertexts))
            $textcont .= $line . "\n";
    } 


    $currentverse=0;
    $verses = Array();
    foreach(preg_split("/((\r?\n)|(\r\n?))/", $textcont) as $line){
        $wantednum = ($currentverse + 1);
        $matchbeginning = "/(.*)\\b($wantednum)(\\s+)(.*)/u";
        preg_match($matchbeginning, trim($line), $groups);
        while(sizeof($groups)>0){
            #Jos jaesisältöä löytyi
            $currentverse++;
            $line = $groups[4];
            if(strlen($groups[1])>0){
                #Jos samalla rivillä kahta jaetta:
                $verses[sizeof($verses)] .= $groups[1];
            }
            $wantednum = ($currentverse + 1);
            $matchbeginning = "/(.*)\\b($wantednum)(\\s+)(.*)/u";
            preg_match($matchbeginning, trim($line), $groups);
        }
        if($currentverse>0)
            $verses = AddVerseContent($currentverse, $verses, $line);
    }


    $chaptermark =  mb_strpos($verses[sizeof($verses)], 'seuraava luku');
    if($chaptermark!==False){
        $verses[sizeof($verses)] = mb_substr($verses[sizeof($verses)], 0, $chaptermark-1);
    }

    $selectedverses = Array();

    if(strpos($verseaddress,"-")!==False){
        #jos jakeet intervallina
        preg_match("/(\\d+)-(\\d+)/", $verseaddress, $groups);
        $start = $groups[1];
        $end = $groups[2];
        for($i=$start;$i<=$end;$i++){
            if(isset($verses[$i]))
                $selectedverses[] = $verses[$i];
        }
    }
    elseif($verseaddress=="" or $verseaddress=="jae/jakeet"){
        #Jos tyhjä jaeosoite
        $selectedverses = $verses;
    }
    else{
        #Jos pelkkä numero
        $selectedverses = $verses[intval($verseaddress)];
    }

    return $selectedverses;
}

if(!isset($embed)){

    $selectedverses = FetchBibleContent($_GET["chap"], $_GET["verses"]);

    ?>


    <html lang="fi">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>
    <p id='biblecontent'>
    <?php
    if (sizeof($selectedverses)>1)
        echo implode($selectedverses, "¤");
    else
        echo ($selectedverses);
    ?>
    </p>
    </body>

<?php
}
?>
