// Note: this code depends on a variable called "publications" that contains
// 		 all of the publication data in json format. It should be initialized in
//		 the Django template file.

// variables to hold the templates, since they will be removed from the DOM after initialization
var groupTemplate, publicationTemplate;

// dictionary for abbreviated publication types
// TODO: this should probably go in the model instead of here
var pubTypeCodes = {
	"Conference": "C",
	"Article": "A",
	"Journal": "J",
	"Book Chapter": "BC",
	"Book": "B",
	"MS Thesis": "T",
	"PhD Dissertation": "D",
	"Workshop": "W",
    "Poster": "P",
    "Demo": "Dm",
    "Work in Progress": "WiP",
    "Late Breaking Result": "LBR",
    "Other": "O"
};

// initialization code that's called when the window has finished loading
$(window).load(function () {

	// preserve the template designs so that they're not lost when updating the display
	groupTemplate = $(".group-template").clone();
	publicationTemplate = $(".publication-template").clone();

	// Hide popovers when clicking outside, but not when clicking inside
	// from: http://stackoverflow.com/a/14857326
	// LS: this is a bit of a hack, since the default click behavior leaves them open
	// until you click on the button again, but the default focus behavior prevents you
	// from interacting with the content of the popover
	$('body').on('click', function (e) {
	    $('[data-toggle="popover"]').each(function () {
	        //the 'is' for buttons that trigger popups
	        //the 'has' for icons within a button that triggers a popup
	        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
	            $(this).popover('hide');
	        }
	    });
	});

	// initialize the filter bar module with the publication data
	preprocessPublications();
	$('#fixed-side-bar').fixedSideBar();
	$('#filter-bar').filterBar({
		items: publications, 
		categories: ["Year", "Pub Type", "Keyword", "Project", "None"],
		groupsForCategory: {
			"Year": groupPublicationsByYear(),
			"Pub Type": groupPublicationsByType(),
			"Keyword": groupPublicationsByKeyword(),
			"Project": groupPublicationsByProject(),
			"None": [{"name": "Chronological List", items: publications}]
		},
		passesFilter: passesFilter,
		displayGroupHeader: formatGroup,
		displayItem: formatPublication,
		afterDisplay: afterDisplay
	});
	$('#filter-bar').applyFilter();
});

// run some additional processing on the publications
function preprocessPublications() {
	var pubTypeCount = {};

	// sort by date
	publications.sort(function(a, b) {
		return a.date - b.date;
	});

	// group into publication types, initialize publication ids (e.g., C.1 for first conference paper)
	publications.forEach(function(pub, index, array) {
		if(!(pub.pub_type in pubTypeCount)) {
			pubTypeCount[pub.pub_type] = 1;
		} else {
			pubTypeCount[pub.pub_type]++;
		}

		pub.id = "[" + pubTypeCodes[pub.pub_type] + "." + pubTypeCount[pub.pub_type] + "]";
	});
	publications.reverse(); // most recent first

	// connect the array index to the dictionary objects for reverse lookup
	publications.forEach(function(pub, index, array) {
		pub["index"] = index;
	});
}

// returns a list of publications grouped by year, sorted with the most recent year first
function groupPublicationsByYear()
{
	var tempGroups = {};
	publications.forEach(function(pub, index, array) {
		var group = pub.date.getFullYear().toString();
		if(!(group in tempGroups)) {
			tempGroups[group] = [];
		}
		tempGroups[group].push(pub);
	});

	var groups = []
	for(group in tempGroups) {
		groups.push({"name": group, "items": tempGroups[group]});
	}

	// years are sorted chronologically, all of the other groupings are sorted by frequency
	groups.sort(function(a,b) { return parseInt(b.name) - parseInt(a.name) });

	return groups;
}

// returns a list of publications grouped by publication venue type, sorted with the most frequent type first
function groupPublicationsByType()
{
	var tempGroups = {};
	publications.forEach(function(pub, index, array) {
		var group = pub.pub_type;
		if(!(group in tempGroups)) {
			tempGroups[group] = [];
		}
		tempGroups[group].push(pub);
	});

	var groups = []
	for(group in tempGroups) {
		groups.push({"name": group, "items": tempGroups[group]});
	}

	// years are sorted chronologically, all of the other groupings are sorted by frequency
	groups.sort(function(a,b) { return b.items.length - a.items.length });

	return groups;
}

// returns a list of publications grouped by keyword, sorted with the most frequent keyword first
// note: a publication can appear in more than one group
function groupPublicationsByKeyword()
{
	var tempGroups = {};
	publications.forEach(function(pub, index, array) {
		var keywordGroups = pub.keywords;
		keywordGroups.forEach(function(group, index, array) {
			if(!(group in tempGroups)) {
				tempGroups[group] = [];
			}
			tempGroups[group].push(pub);
		});
	});

	var groups = []
	for(group in tempGroups) {
		groups.push({"name": group, "items": tempGroups[group]});
	}

	// years are sorted chronologically, all of the other groupings are sorted by frequency
	groups.sort(function(a,b) { return b.items.length - a.items.length });

	return groups;
}

// returns a list of publications grouped by project, sorted with the most frequent project first
// note: a publication can appear in more than one group
function groupPublicationsByProject()
{
	var tempGroups = {};
	publications.forEach(function(pub, index, array) {
		var projectGroups = pub.projects;
		projectGroups.forEach(function(group, index, array) {
			if(!(group in tempGroups)) {
				tempGroups[group] = [];
			}
			tempGroups[group].push(pub);
		});
	});

	var groups = []
	for(group in tempGroups) {
		groups.push({"name": group, "items": tempGroups[group]});
	}

	// years are sorted chronologically, all of the other groupings are sorted by frequency
	groups.sort(function(a,b) { return b.items.length - a.items.length });

	return groups;
}

// returns true if the publication contains the text entered into the filter box anywhere
// in the title, authors, venue, keywords, or projects
function passesFilter(pub, filter) {
	filter = filter.toLowerCase();
	var passes = false;
	if(!filter || filter.length == 0) passes = true;

	if(pub.title.toLowerCase().indexOf(filter) >= 0) passes = true;
	if(pub.venue.toLowerCase().indexOf(filter) >= 0) passes = true;
	pub.authors.forEach(function(author, index, array) { 
		if(author.name.toLowerCase().indexOf(filter) >= 0) passes = true; 
	});
	pub.keywords.forEach(function(keyword, index, array) { if(keyword.toLowerCase().indexOf(filter) >= 0) passes = true; });
	pub.projects.forEach(function(project, index, array) { if(project.toLowerCase().indexOf(filter) >= 0) passes = true; });

	return passes;
}

// adds html markup to the specified text wherever it matches the filter, applying the highlight style
function addHighlight(text, filter) {
	var result = text;
	if(filter && filter.length > 0)
		result = text.replace(new RegExp('(' + filter + ')', 'gi'), "<span class=\"highlight\">$1</span>");
	return result;
}

// helper function to populate the template with the group data
function formatGroup(group) {
	var groupData = groupTemplate.clone();
	groupData.attr("name", group);
	groupData.html(group);
	return groupData[0].outerHTML;
}

// helper function to populate the template with the publication data
function formatPublication(pub, filter) {
	if(filter) filter = filter.toLowerCase();

	var publicationData = publicationTemplate.clone();
	publicationData.find(".publication-id").html(pub.id);
	publicationData.find(".publication-thumbnail-link").attr("href", pub.pdf);
	publicationData.find(".publication-thumbnail-image").attr("src", pub.thumbnail);
	publicationData.find(".publication-title").html(addHighlight(pub.title));

	var authors = publicationData.find(".publication-authors");
	var authorTemplate = authors.find(".publication-author");
	var authorLastTemplate = authors.find(".publication-author-last");
	authors.html("");
	pub.authors.forEach(function(author, index, array) {
		var authorData = index + 1 < array.length ? authorTemplate.clone() : authorLastTemplate.clone();
		authorData.find("a").attr("href", author.link);
		authorData.find("a").html(addHighlight(author.name, filter));
		authors.append(authorData);
	});

	publicationData.find(".publication-venue").html(addHighlight(pub.venue, filter));

	if(pub.award) { 
		publicationData.find(".publication-award-text").html(addHighlight(pub.award, filter));
	} else {
		publicationData.find(".publication-award").css("display", "none");
	}

    if(pub.total_papers_accepted && pub.total_papers_submitted) {
    	publicationData.find(".publication-acceptance-rate-text").html("Acceptance Rate: " + (pub.total_papers_accepted / pub.total_papers_submitted * 100).toFixed(0) + "% (" + pub.total_papers_accepted + " / " + pub.total_papers_submitted + ")");
	} else {
		publicationData.find(".publication-acceptance-rate").css("display", "none");
	}

	if(pub.to_appear) {
        publicationData.find(".publication-to-appear").css("display", "block");
    } else {
    	publicationData.find(".publication-to-appear").css("display", "none");
    }

    if(pub.keywords.length > 0)
    {
    	var keywords = publicationData.find(".publication-keywords");
		var keywordTemplate = keywords.find(".publication-keyword");
		var keywordLastTemplate = keywords.find(".publication-keyword-last");
		keywords.html("");	
        pub.keywords.forEach(function(keyword, index, array) {
        	var keywordData = index + 1 < array.length ? keywordTemplate.clone() : keywordLastTemplate.clone();
			keywordData.find(".publication-keyword-text").html(addHighlight(keyword.toLowerCase(), filter));
			keywords.append(keywordData);
	    });
	} else {
		publicationData.find(".publication-keywords").css("display", "none");
	}

	publicationData.find(".publication-download-link").attr("href", pub.pdf);
	publicationData.find(".publication-citation-link").attr("data-content", createCitationText(pub));

	return publicationData[0].outerHTML;
}

// called after initialization or whenever the filter is reapplied
function afterDisplay() {
	$('[data-toggle="popover"]').popover()

	// Manual trigger to get around idiosyncrasies of bootstrap's popover control
	$('[data-toggle="popover"]').click(function() {

		// prevent multiple popovers from being open at once
		var popovers = $('[data-toggle="popover"]')
		for(var i = 0; i < popovers.length; i++) {
			if(popovers[i] != this) // ignore the current popover
				$(popovers[i]).popover('hide');
		}

		// toggle this popover
		$(this).popover('toggle');
	});
}

// combines and formats the citation metadata for display
function createCitationText(pub) {
	var text = "";
	
	// authors
	pub.authors.forEach(function(author, index, array) {
		text += author.last_name + ", " + author.first_name.substring(0,1) + ". ";
		if(author.middle_name && author.middle_name.length > 0)
			text += author.middle_name.substring(0,1) + ". ";
		text = text.substring(0, text.length-1) + ", "; // trim last space, add comma
	});
	if(text.length > 0) text = text.substring(0, text.length - 2); // trim last comma and space

	// year
	text += " (" + pub.date.getFullYear() + "). ";

	// title
	text += pub.title + ". ";

	// venue
	text += "<i>" + pub.venue + "</i>. "

	// pages
	if(pub.to_appear) {
		if(pub.num_pages) {
			text += pub.num_pages + " pages.";
		}
		text += " <i>To Appear</i>.";
	} else if(pub.start_page && pub.end_page) {
		text += pub.start_page + "&ndash;" + pub.end_page + ".";
	}

	return text;
}