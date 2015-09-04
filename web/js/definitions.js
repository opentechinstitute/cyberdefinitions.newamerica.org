
function getResourceID() { return 'c6ab94f6-0323-44a3-970f-549df5da0939'; }
function getCkanUrl() { return 'https://data.opentechinstitute.org/api/3/action/datastore_search'; }
function emptytext() { return '<div class="no-results">Sorry, no terms meet the current filters. Try a broader search, or a different term.</div>'}

function buildDefaultDataObj() {
  var data = {
    resource_id : getResourceID(),
     fields : 'Term',
    // limit: 500,
    // distinct : true, // this doesn't seem to work, but leaving in hope that it migh
  }
    return data;
}

// this function lets us prime a local term object
function loadTerms() {
    if ($('body').data('terms') === undefined) {
        var data = buildDefaultDataObj();
        data['fields'] = 'Term';
        data['limit'] = 10000;
        $.ajax({
            //  headers: {Authorization: getAuthToken()},
            url: getCkanUrl(),
            data: data,
            dataType: 'json',
            async: false,
            success: function(data) {
                terms = {};
                for (i = 0; i < data.result.total; i++) {
                    var term = data.result.records[i].Term;
                    if (!(term in terms)) { terms[term] = 1; }
                }
            }
        });
        $('body').data('terms', terms);        
    }
    var terms = $('body').data('terms');
    return terms;
}
function loadTermsArray() {
  var terms = loadTerms();
  var out = [];
  $.each( terms, function( k, v ) {
    out.push(k);
  });
  return out;
}

function loadYears() {
    if ($('body').data('years') === undefined) {
        var data = buildDefaultDataObj();
        data['fields'] = 'Year';
        data['limit'] = 10000;
        $.ajax({
            //  headers: {Authorization: getAuthToken()},
            url: getCkanUrl(),
            data: data,
            dataType: 'json',
            async: false,
            success: function(data) {
                years = {};
                for (i = 0; i < data.result.total; i++) {
                    var year = data.result.records[i];
                    year = year['Year'];
                    if (year === 'No year given') {
                        var ckanyear = '';
                        var year = year;
                    }
                    else {
                        var ckanyear = year;
                        year = year.substring(0, year.length -2);
                    }
                    if (!(year in years)) { years[year] = ckanyear; }
                }             
                $('body').data('years', years);
            }
        });
    }
    var years = $('body').data('years')
    return years;
}
function loadYearsArray() {
  var years = loadYears();
  var out = [];
  $.each(years, function( k, v ) {
    out.push(k);
  });
    return out.sort();
}
function buildYearSelect() {
    var ckanyears = loadYears();
    var years = loadYearsArray();
    var noyear = years.pop();
    var options = '<option value="'+ noyear +'">'+ noyear +'</option>';
    $.each(years, function(k, year) {
        options += '<option value="'+ ckanyears[year] +'">'+ year +'</option>';
    });
    $('select#Year').append(options);    
}

function sourceQuery() {
    $('div#search-result').empty();

    var selects = advSearchFormSelectValues();
    if (selects) {
        var filters = advSearchFormCheckboxValues();   
        var data = {
            resource_id : getResourceID(),
            distinct : true,
        }

        var selectfilters = '{';
        var newfilters = {};
        var i = 0;
        $.each(selects, function(id, value) {
            if (i > 0) { selectfilters += ', ' } 
            selectfilters += '"'+ id +'":"'+ value +'"';
            newfilters[id] = value;
            i++;
        });
        selectfilters += '}';
    // if (filters) {
    //     $.each(filters, function(field, val) {
    //         queryFilters += '\"'+ field +'\":\"'+ val +'\"';             
    //     });
    // }
        data['filters'] = selectfilters;

        $.ajax({
            url: getCkanUrl(),
            data: data,
            dataType: 'jsonp',
            asnyc: false,
            success: function(data) {
                if (data.result.total > 0) { $("div#search-result").append('<ul id="term-tabs"></ul>');}
                else { $("div#search-result").append('<div id="term-defs">'+ emptytext() +'</div>'); }
                var results = data.result.records;
                var terms = [];
                $.each(results, function(k, result) {
                    // var skiprecord = true;
                    if (result.Year === 'No year given') { var year = result.Year }
                    else { var year = result.Year.substring(0, result.Year.length -2); }
                    if (filters) {
                        $.each(result, function(field, value) {
                            var filtername = field.replace(/ /g, '');
                            if ((filters[filtername] != undefined) && (filters[filtername] == value) && ($.inArray(result.Term, terms) === -1)) {
                                terms.push(result.Term);
                            }
                        });
                    }
                    else if ($.inArray(result.Term, terms) === -1) {
                        terms.push(result.Term);
                    }
                });
                menu = '';
                $.each(terms.sort(), function(k, term) {                
                    var id = term.replace(/ /g,"-")+k;
                    var term = terms[k];
                    menu += '<li><a href="#'+ id +'">'+ term +'</a></li>';
                });
                $('ul#term-tabs').append(menu);
                definitionTabs();
            }
        });
    }
}

function firequery(query, op, fields) {
    var checkboxValues =  advSearchFormCheckboxValues();
    $('body').data('searchop', op);
    var data = {
        resource_id : getResourceID(),
        // limit: 10,
        // filters: "{\"Term\" : \""+ query +"\"}",
        sort: "Term"
    };
    if (op === 'filters') {
        data["filters"] = "{\"Term\" : \""+ query +"\"}";
        data["sort"] = "Source";
    }

    if (op === 'q') {
        data["q"] = query;
    }
    // if (fields === 'term') {
    //     data["fields"] = "Term";
    // }
    $('form#search-form #q').val(query);    
    $.ajax({
        //    headers: {Authorization: getAuthToken()},
        url: getCkanUrl(),
        data: data,
        dataType: 'jsonp',
        success: function(data) {
            // clear out the old definitions  
            $('div#search-result').empty();  

            // if (op === 'q') {
            //   $("div#search-result").append('<ul id="term-tabs"></ul>');
            // }  
            //      else
            // if (op === 'filters'){
            $('div#search-result').append('<div id="term-heading"></div>')
            $("div#search-result").append('<div id="term-defs"></div>');
            //}
            var menu = '';
            var content = ''; 
            var records = data.result.records;
            var exists = {};
            var selectValues = advSearchFormSelectValues();
            var numbershowing = 0;
            $.each( records, function( k, v ) {
                var term = v.Term;
                if (v.Year === 'No year given') { var year = v.Year }
                else { var year = v.Year.substring(0, v.Year.length -2); }

                var skiprecord = false;
                if (checkboxValues) {
                    $.each(checkboxValues, function(field, val) {
                        skiprecord = true;
                        if (v[field] == val) { skiprecord = false; }
                    });
                }
                if (selectValues) {
                    matches = {};
                    $.each(selectValues, function(id, value) {
                        if( value != 'any') {
                            if (v[id] == value) { matches[id] = true; } else { matches[id] = false; }
                        }
                    });
                    $.each(matches, function(id, bool) {
                        if (bool === false) { skiprecord = true; }
                    });

                }        
                if (!(term in exists)) {
                    exists[term] = 1;
                    var addterm = true;
                }
                if (addterm) {
                    $('div#term-heading').append('<h3 id="'+ id +'">'+ term +'</h3>');
                }

                var op = $('body').data('op');
                if (skiprecord == false) {
                    numbershowing++;
                    var id = term.replace(/ /g,"-")+k;
                    // if (op === 'q'  && addterm) {
                    //   menu += '<li><a href="#'+ id +'">'+ term;
                    //   // if (v.State != ''  && !fuzzy) {
                    //   //   menu += ' <span class="state">('+ v.State +')</span>';
                    //   // }
                    //   // menu += '</a></li>';
                    // } 
                    //  //else
                    // if (op === 'filters') {
                    if (data.result.total > 5){
                        content += '<div class="showhide showing"><span class="link"><a id="toggle-'+ id +'">hide</a></span></div>';
                    }
                    content += '<div id="'+ id +'" class="card">';
                    var termspan = '<span class="termname" style="font-weight:bold;">'+ term +': </span>';
                    if (v.Source != '') {
                        termspan += ' <span class="source" style="font-style:italic; float:right" >('+ v.Source +', '+ year +')</span>';
                    }
                    content += termspan;
                    content += '<div class="definition">'+ v.Definition +'</div>';
                    if (v.Link === 'Offline') {
                        content += '<div class="citation">'+ v["Full Citation"] +' (Offline Source)</div>';
                    }else {
                        content += '<div class="citation"><a href="'+ v.Link +'">'+ v["Full Citation"] +'</a></div>';
                    }
                    content += '</div>'; 

                    // }
                }
            });

            // if (op === 'q') {
            //   $("ul#term-tabs").append(menu);
            //   definitionTabs();
            // }
            var deeplink = null;
            if (content === ''){
                var content = emptytext();
            }
            else {
                var deeplink = '<div id="deeplink">Share this search: <br /><input type="text" readonly="readonly" value="'+ buildDeepLink() +'"> </div>';
            }
            if (deeplink) {
                $('div#search-result').append(deeplink);
                $("div#deeplink input[type=text]").click(function() {
                    $(this).select();
                });
            }
            if (op === 'filters') {
                $("div#term-defs").append(content);
                $("div#term-defs .showhide").click(function() {
                    var a = $(this).find('a');
                    var id = a.attr('id').replace(/toggle-/g, "");

                    if ($(this).hasClass('showing')) {
                        $(this).removeClass('showing');
                        $(this).addClass('hiding');
                        $("div#"+ id).hide();
                        var term = $("div#"+ id +" .termname").text();
                        var source = $("div#"+ id +" .source").text();
                        $(this).prepend('<span class="heading">'+ term + source +'</span>');
                        a.text('show');

                    }
                    else if ($(this).hasClass('hiding')) {
                        $(this).find('.heading').remove();
                        $(this).removeClass('hiding');
                        $(this).addClass('showing');
                        a.text('hide');
                        $("div#"+ id).show();                        
                    }
                });
            }
            if (numbershowing < 5) {$("div#term-defs .showhide").remove()}
        }
    });
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function getAllParams() {
    var querystring = window.location.href.split('?')[1];
    if (querystring) {
        var queryparams = querystring.split('&');
        
        var params = {};
        $.each(queryparams, function(key, value) {
            var values = value.split('=');
            params[values[0]] = values[1];
        });
        return params;
    }
    else { return false; }
}

function advSearchFormSelectValues() {
    var selectvals = {};
    var i = 0;
    $.each($('div#adv-search select'), function(select) {
        value = $(this).val();
        id = $(this).attr('id');
        if ((value != 'any')) { selectvals[id] = value; i++;} 
    });
    if (i > 0) {return selectvals;} else { return false; }
}

function advSearchFormPageLoadValues() {
    //    $.each(getAllParams(), function(param, value) {
    var params = getAllParams();
    if (params) {
        var formInputs = $('form#search-form input');
        $.each(formInputs, function(input) {
            var type = $(this).attr('type');
            var name = $(this).attr('name');
            var val = $(this).val();
            if ((type === 'text') && (name in params)) {
                $(this).val(params[name].replace('+', ' '));
            }
            if ((type === 'checkbox') && (name in params)) {
                $(this).prop('checked', true);
            }

        });
        var formSelects = $('form#search-form select');
        $.each(formSelects, function(select) {
            var id = $(this).attr('id');
            if (id in params) {
                $('div#adv-search select#'+ id).val(params[id]);  
            }
        });        
        if (params['q'] != '') {
            firequery(caseMatch(params['q'].replace('+', ' ')), 'filters');
        } else {
            firequery('', 'source');
        }

    }
}
function advSearchFormCheckboxValues() {
    // var query = $('form#search-form input:text[name=q]').val();
    var p5 = parseInt($('form#search-form input:checkbox[name=P5]:checked').val());
    var ungge4 = parseInt($('form#search-form input:checkbox[name=UNGGE4]:checked').val());
    var osce = parseInt($('form#search-form input:checkbox[name=OSCE]:checked').val());
    var otherstate = parseInt($('form#search-form input:checkbox[name=OtherState]:checked').val());
    var igo = parseInt($('form#search-form input:checkbox[name=IGO]:checked').val());
    var othersource = parseInt($('form#search-form input:checkbox[name=OtherSource]:checked').val());
    var osceOfficial = parseInt($('form#search-form input:checkbox[name=OSCEOfficial]:checked').val());
    // if (!ungge4) {  var ungge4 = 0; }
    // if (!osce) { var osce = 0; }
    // if (!otherstate) { var otherstate = 0; }
    // if (!igo) { var igo = 0; }
    // if (!othersource) { var othersource = 0; } 

    // if (op === 'filters') { filters += "\"Term\" : \""+ query +"\""; }
    var i = 0;
    var values = {};
    if (p5 === 1) {values['P5'] = p5; i++;}
    if (ungge4 == 1) {values['UNGGE4'] = ungge4; i++;}
    if(osce == 1) {values['OSCE'] = osce; i++;}
    if(otherstate == 1) {values['OtherState'] = otherstate; i++;}
    if(igo == 1) {values['IGO'] = igo; i++;}
    if ( othersource == 1) {values['OtherSource'] = othersource; i++;}
    if ( osceOfficial == 1) {values['OSCEOfficial'] = osceOfficial; i++;}

    if (i > 0) {
      return values; 
    }
    else {
      return false;
    }   
}

function loadUniqueSourceFields() {
  var data = {
    resource_id : getResourceID(),
    fields : 'Source',
    limit: 10000,
    //distinct : true, // this doesn't seem to work, but leaving in hope that it migh
  }
  var sources = {};
  $.ajax({
//    headers: {Authorization: getAuthToken()},
    url: getCkanUrl(),
    data: data,
    dataType: 'json',
    async: false,
    success: function(data) {
      for (i = 0; i < data.result.total; i++) {
        var source = data.result.records[i].Source;
        if (!(source in sources)) { sources[source] = true; }
      }
    }
  });
  return sources;
}
function loadSourceFieldsArray() {
  var sources = loadUniqueSourceFields();
  var out = [];
  $.each( sources, function( k, v ) {
    out.push(k);
  });
  return out.sort();
}

function buildDeepLink() {
    var link = window.location.href.split('?')[0] +'?';
    var formInputs = $('form#search-form input');
    params = {};
    $.each(formInputs, function(input) {
        var type = $(this).attr('type');
        var name = $(this).attr('name');
        var val = $(this).val();
        if ((type === 'text') && (val != '')) {
            params[name] = val;
        }
        if ((type === 'checkbox') && ($(this).prop('checked') === true)) {
            params[name] = val;
        }

    });
    var formSelects = $('form#search-form select');
    $.each(formSelects, function(select) {
        var id = $(this).attr('id');
        var val = $(this).val();
        if (val != 'any') {
            params[id] = val;
        }
    });
    link += $.param(params);
    return link;
}


function definitionTabs() {
  $('ul#term-tabs').each(function(){
    // For each set of tabs, we want to keep track of
    // which tab is active and it's associated content
    var $active, $content, $links = $(this).find('a');

    // If the location.hash matches one of the links, use that as the active tab.
    // If no match is found, use the first link as the initial active tab.
    $active = $($links.filter('[href="'+location.hash+'"]')[0] || $links[0]);
    $active.addClass('active');
    $active.parent().addClass('active');
    $content = $($active.attr("href"));

    // Hide the remaining content
    $links.not($active).each(function () {
      $(this.hash).hide();
    });

    // Bind the click event handler
    $(this).on('click', 'li', function(e){
      var query = $(this).find('a').text();
      firequery(query, 'filters', 'all');        
  


          // Make the old tab inactive.
          $('ul#term-tabs li').removeClass('active');
          $active.find('a').removeClass('active');
          $content.hide();

          // Update the variables with the new link and content
          $active = $(this);
          $content = $($active.find('a')[0].hash);

          // Make the tab active.
          $active.addClass('active')
          $active.find('a').addClass('active');
          $content.show();

          // Prevent the anchor's default click action
          e.preventDefault();
    });
  });
}


function getTermsFromDataset(query) {
  var ret = {}
  $.each($("datalist#terms option"), function(option) {
      ret[$(this).val()] = $(this).val();
  });

  return ret;   
}


function caseMatch(query) {
    var terms = getTermsFromDataset();
    var term = $.each(terms, function(t, v) {
      if (t.toLowerCase() === query.toLowerCase()){
          query = t;
      }
    });
    return query
}


$(document).ready(function() {
    // pull in various dynamic form lists
    termlist = '<datalist id="terms">';
    $.each(loadTerms(), function(term, v) {
        termlist += '<option value="'+ term +'">';
    });
    termlist += '</datalist>';
    $('body').append(termlist);
    var source = loadSourceFieldsArray();
    var sourceselect = '';
    $.each(source, function(key, source) {
        sourceselect += '<option value="'+ source +'">'+ source +'</option>';
    });
    $("select#Source").append(sourceselect);
    buildYearSelect();
    // now check the query string for values and update the form.
    advSearchFormPageLoadValues();
    var selectValues = advSearchFormSelectValues();
    var formqueryval = $('form#search-form #q').val();
    if (getParameterByName('q') === '' && selectValues['Source'] === undefined) { sourceQuery(); }
    if (formqueryval != '') { firequery(formqueryval, 'filters'); }

    //wordCloud();
    //map();
    var op = $('body').data('op');
    var thread = null;
    $('#q').bind('input', function() {
        var query = caseMatch($(this).val());
        if (query === '' ) { sourceQuery(); }
        else {
            clearTimeout(thread);
            thread = setTimeout(function() { firequery(query, 'filters', 'all'); }, 1000);
        }
    });
    $('#adv-search input:checkbox').click(function() {
        var query = $('form#search-form input:text[name=q]').val();
        if (query === '' ) { sourceQuery(); }
        else { firequery(query, 'filters', 'all'); }            
    }); 
    $('#adv-search select').change(function() {
        var query = $('form#search-form input:text[name=q]').val();
        if (query === '' ) { sourceQuery(); }
        else { firequery(query, 'filters', 'all'); }
    });

});

function show( elem ){
    $('.dynamic_link').hide();
    $('#'+elem).show();
}

 
