This is a POC project to help everyone build advanced interactive chat bots.

It works with discord right now, has NLP.js setup for one intent (send selfie), and some !commands. Direct messages are supported, not setup for chatrooms/groups. First user interaction creates a directory titled as their discord ID under /user where chatlog and character data are stored. Each user can have a custom character this way.

Emojis and images sent to the bot are captioned for their reaction.

TO DO:
more detils in this readme
release the source code!

think about making [NOTES] at end of line only display in prompt & NOT log

THOUGHTS:
how do i want to utilize intent recognition?

Define facts in each unique bot's character profile, creating a long list of specific strings which can be pulled into a prompt like [{botName} is a {age}-year-old {gender} living in {location}.] when the intent "tell me about yourself" is detected.

so what intents should be recognized for this kind of variable template?


this is as close as we can come to "memory recall" to prompt with facts when needed.

"memory formation" though will take manual addition, or some parsing & state...
think on this, because it could actually make these bots GOOD!

SIGNIFICANT classifier with entity extraction ... "i statements" (self-declared profile)
now that would be neat to have a bot build its own profile from self-description.

relationship state needs to be a thing. (but how to update it?)

do some sentiment analysis on bot's outputs, then display the current emotion by name?
messages with emotions can have point values +/- which move the relationship through stages.