<?php

function FormUrl($book, $chapter){
    return  "http://raamattu.fi/1992/$book.$chapter.html";
}

function StripRaamattuHtml($html){
    return mb_substr($html, 0, mb_strrpos($html, "<hr>")-1);
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
    $headertexts = Array();
    foreach ($headers as $header) {
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

$pageDom = GetHtml("bibletest.html");
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
    if(sizeof($groups)>0){
        $currentverse++;
        $line = $groups[4];
        if(strlen($groups[1])>0){
            #Jos samalla rivillä kahta jaetta:
            $verses[sizeof($verses)] .= $groups[1];
        }
    }
    if($currentverse>0)
        $verses = AddVerseContent($currentverse, $verses, $line);
}


$chaptermark =  mb_strpos($verses[sizeof($verses)], 'seuraava luku');
if($chaptermark!==False){
    $verses[sizeof($verses)] = mb_substr($verses[sizeof($verses)], 0, $chaptermark-1);
}

?>
