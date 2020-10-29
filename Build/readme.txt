edit "run.bat" you can change the url it pings, the thing it looks for on the page and the ping cooldown time (in milliseconds)

for example 
	ps5_sweeper-win "google.co.uk" "<body>" 1000

	This will ping google every second and will look for <body> in the HTML. Make sure the URL and the element you're looking
	for is wrapped in "'s though or this wont run.