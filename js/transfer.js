
function getQueryVariable(variable, query) {
    // http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
    if (query === undefined) {
        query = window.location.search.substring(1);
    }
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

function kortform(s) {
    switch (s.toLowerCase()) {
        case 'oslo museum':
            return 'OMU';
        case 'oslo byarkiv':
            return 'BAR';
        case 'norsk folkemuseum':
            return 'NF';
        case 'arbeiderbevegelsens arkiv og bibliotek':
            return 'ARB';
        case 'telemuseet':
            return 'TELE';
        case 'teknisk museum':
            return 'NTM';
        case 'universitetsbiblioteket i bergen':
            return 'UBB';
        default:
            return 'UNKNOWN';
    }

}

$(document).ready(function(){

    var license, author, dato, year, institusjon, inst, bildenr, samling, historikk, motiv, tittel, src;

    $('div#info').hide();
    $('form#upload').hide();

    $('.spinner')
        .hide()  // hide it initially
        .ajaxStart(function () {
            $(this).show();
            $(':button,:submit').attr('disabled', true);
            $('div#info').hide();
            $('form#upload').hide();
        })
        .ajaxStop(function () {
            $(this).hide();
            $(':button,:submit').attr('disabled', false);
        });

    function fill_desc() {
        var imgFilename = '',
            beskrivelse = '',
            desc = '';
        if (motiv != "NOTFOUND") {
            beskrivelse += motiv + '.';
        } else if (tittel != "NOTFOUND") {
            beskrivelse += tittel + '.';
        }
        if (historikk != "NOTFOUND") {
            beskrivelse += ' ' + historikk + '.';
        }
        var lics = $('select.license').val();
        if (lics !== undefined) {
            license = '{{' + lics.join('}}\n{{') + '}}';
        } else {
            license = '{{' + license + '}}';
        }
        desc = ['',
            '=={{int:filedesc}}==',
            '{{Information',
            '|description = {{no|1=' + beskrivelse + '}}',
            '|source = {{Oslobilder|' + inst + '|' + bildenr + '|collection=' + samling + '}}',
            '|author = ' + author,
            '|date = ' + dato,
            '|permission = ',
            '|other_versions = ',
            '|other_fields = ',
            '}}',
            '',
            '=={{int:license-header}}==',
            license,
            '',
            ''].join('\n');
        $('#wpUploadDescription').val(desc);
        if (tittel != 'NOTFOUND') {
            $('#Bildetittel').html(tittel);
            imgFilename = tittel;
            if (year !== 0) {
                imgFilename += ' (' + year + ')';
            }
            imgFilename += '.jpg';
        } else {
            $('#Bildetittel').html('-');
            imgFilename = getQueryVariable('filename', src);
            $('#wpDestFile').parent().siblings('.warn').show();
        }
        $('#wpDestFile').val(imgFilename);

        $('#wpDestFile').parent().siblings('.warn')
    }

    $('#theform').on('submit', function(e) {
        var url = $('#inputurl').val();
        $.getJSON('./transfer_bg.fcgi', { 'url': url }, function(data) {
            var imgLink = 'Lagre <a href="' + data.src + '" target="_blank">filen</a> lokalt på din maskin først, og trykk så: ',
                d = new Date(),
                current_year = d.getFullYear();
            src = data.src;
            license = data.license;
            author = data.metadata.Fotograf;
            dato = data.metadata.Datering;
            institusjon = data.metadata.Eierinstitusjon;
            inst = kortform(institusjon);
            bildenr = data.metadata.Bildenummer;
            samling = data.metadata['Arkiv/Samling'];
            historikk = data.metadata.Historikk;
            motiv = data.metadata.Motiv;
            tittel = data.metadata.Bildetittel;
            
            year = parseInt(data.year);
            if (dato == 'NOTFOUND') {
                dato = '{{Unknown|date}}';
                $('#Datering').html('<em>Ukjent</em>');
            } else {
                $('#Datering').html(dato);
            }

            if (historikk != "NOTFOUND") {
                $('#Historikk').html(historikk);
            } else {
                $('#Historikk').html('-');
            }
            if (tittel != 'NOTFOUND') {
                $('#Bildetittel').html(tittel);
            } else {
                $('#Bildetittel').html('-');
            }
            if (author != 'NOTFOUND') {
                $('#Fotograf').html(author);
            } else {
                author = '{{Unknown|author}}';
                //$('#Fotograf').html('<span class="warning">Uh oh, fant ikke bildets fotograf! Sjekk om fotografens navn kan være oppgitt i det grå feltet nederst på selve bildet.</span>');
                $('#Fotograf').siblings('.warn').show();

            }
            if (motiv != "NOTFOUND") {
                $('#Motiv').html(motiv);
            } else {
                $('#Motiv').html('-');
            }
            
            var avbildet = Array();
            $.each(data.metadata['Avbildet sted'].split('|'), function(i, k) {
                if (k != 'NOTFOUND') {
                    avbildet.push('<span class="key">' + $.trim(k) + '</span> (sted)');
                }
            });
            $.each(data.metadata['Utsikt over'].split('|'), function(i, k) {
                if (k != 'NOTFOUND') {
                    avbildet.push('<span class="key">' + $.trim(k) + '</span> (utsikt over)');
                }
            });
            $.each(data.metadata['Utsikt over'].split('|'), function(i, k) {
                if (k != 'NOTFOUND') {
                    avbildet.push('<span class="key">' + $.trim(k) + '</span> (utsikt over)');
                }
            });
            var emneord = Array();
            if (data.metadata['Emneord'] != 'NOTFOUND') {
                $.each(data.metadata['Emneord'].split('|'), function(i, k) {
                    emneord.push('<span class="key">' + $.trim(k) + '</span>');
                });
            }
            $('#Avbildet').html(avbildet.join(' '));
            $('#Emneord').html(emneord.join(' '));
            $('#imgLink').html(imgLink);
            
            $('div#info').show();

            //if (current_year - year > 100) {
            //    license = 'pd-old-100';
            //}

            switch (license) {
                case 'pd':
                    var lisens = 'Bildet er falt i det fri.<ul>' +
                        '<li>Mal for Norge: <select class="license" name="license1">' +
                        '<option val="{{PD-Norway50}}">{{PD-Norway50}} Vanlig fotografi</option>' +
                        '<option val="{{PD-Norway}}">{{PD-Norway}} Åndsverk</option>' +
                        '</select></li>';

                    lisens += '<li>Mal for USA: <select class="license" name="license2"><option val="">Velg:</option>';
                    var sel = '';
                    if (year < 1923) {
                        sel = 'selected="selected"'
                    }
                    lisens += '<option val="{{PD-1923}}"'+sel+'>{{PD-1923}} Bildet er publisert før 1923.</option>';
                    //license = '{{PD-Norway50}}\n{{PD-1923}}';
                    
                    lisens += '</select></li></ul><input type="button" id="license-btn" value="Ok" />';
                    $('#Lisens').html('<div class="ok">' + lisens + '</div>');
                    $('#license-btn').click(function() {
                        $('form#upload').show();
                        fill_desc();
                    });
                    break;
                case 'by-sa':
                    $('#Lisens').html('<div class="ok">CC-BY-SA er en <a href="//commons.wikimedia.org/wiki/Commons:Licensing">akseptabel lisens</a>.</div>');
                    license = 'cc-by-sa-3.0';
                    $('form#upload').show();
                    fill_desc();
                    break;
                case 'by-nc-nd':
                    $('#Lisens').html('<div class="fail">CC-BY-NC-ND er ikke en <a href="//commons.wikimedia.org/wiki/Commons:Licensing">akseptabel lisens</a>.</div>');
                    return;
                default:
                    $('#Lisens').html('<div class="fail">Klarte ikke å gjenkjenne lisensen.</div>');
            }

        });
        return false;
    });

});