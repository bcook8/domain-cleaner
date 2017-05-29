$(function(){

  $(document).ready(function(){

    var $copyBtn = $("#copy-btn"),
        $clearBtn = $("#clear-btn"),
        $parseBtn = $("#parse-btn"),
        $modalCopyBtn = $("#modal-copy-btn"),
        $launchGoDaddyBtn = $("#launch-go-daddy-btn"),
        $inputTextbox = $("#input-textbox"),
        $resultsTextContainer = $("#results-text-container"),
        $resultsArea = $("#results-area").hide(),
        results,
        parser;

    var resultsTextTemplate = $("#results-text-template").html(),
        tldResultTemplate = $("#tld-result-template").html(),
        duplicateResultTemplate = $("#duplicate-result-template").html();

    var clip1 = new Clipboard("#copy-btn", {
          target: function(trigger) {
            return $inputTextbox[0];
          }
        }),
        clip2 = new Clipboard("#parse-btn", {
          target: function(trigger) {
            return $inputTextbox[0];
          }
        })


    DomainCleaner.init().then(function(dc){
      parser = dc;
    });

    var renderTLDResults = function(results){
      var hashCounts = results.getDomainTLDHashCounts();

      if(Object.keys(hashCounts).length === 0){
        return 'Not Available';
      }

      return Object.keys(hashCounts)
        .map(function(tld){
          return $.trim(
            tldResultTemplate
              .replace('{{tld}}', tld)
              .replace('{{tldCount}}', hashCounts[tld])
          );
        })
        .join('');
    }

    var renderDuplicateResults = function(results){
      var duplicateNameCounts = results.getDuplicateDomainNameCountsList();

      if(duplicateNameCounts.length === 0){
        return 'None';
      }

      return duplicateNameCounts.map(function(obj){
          return $.trim(
            duplicateResultTemplate
              .replace('{{duplicate}}', obj.name)
              .replace('{{duplicateCount}}', obj.count)
          );
        })
        .join('');
    }

    var renderResults = function(results){
      $resultsTextContainer.html(
        resultsTextTemplate
          .replace('{{totalDomainsCount}}', results.getUniqueDomains().length)
          .replace('{{tldResults}}', renderTLDResults(results))
          .replace('{{duplicateResults}}', renderDuplicateResults(results))
      );

    };

    $inputTextbox.change(function(){

    });

    $clearBtn.click(function(ev){
      $inputTextbox.val('');
    });

    $parseBtn.click(function(ev){
      var text = $inputTextbox.val();

      if (text === '') return;
      $resultsArea.show();
      results = parser.parse($inputTextbox.val());

      // TODO: Handle empty results;

      $inputTextbox.val(results.getUniqueDomains().join('\n'));
      renderResults(results);
      window.open(
        "https://www.godaddy.com/domains/bulk-domain-search.aspx",
        '_blank',
        'location=yes,height=470,width=720,scrollbars=yes,status=yes');
    });

  });



}())
