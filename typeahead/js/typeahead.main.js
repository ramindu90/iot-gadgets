$(document).ready(function() {
	var source = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: 'https://twitter.github.io/typeahead.js/data/films/post_1960.json',
		remote: {
			url: 'https://twitter.github.io/typeahead.js/data/films/queries/%QUERY.json',
			wildcard: '%QUERY'
		}
	});

	$('#typeahead .typeahead').typeahead({
		hint: true,
		highlight: true,
		minLength: 1
	},
	{
		name: 'data-source',
		display: 'value',
		source: source
	}).on('typeahead:selected', onAutocompleted);
	console.log("Done binding");

	function onAutocompleted($e, datum) {
		alert(JSON.stringify(datum))
        return false;
    }
});