/**
 * The quote shown above the title, fresh on every visit.
 *
 * Held locally rather than fetched. The free quote APIs are either gone
 * (quotable.io), blocked from the browser (zenquotes sends no CORS header),
 * or serve unvetted scraped text — one handed back a line calling women
 * "one of nature's agreeable blunders", another a joke about sex drive.
 * A keyword filter screens vocabulary, not sentiment, so it cannot make an
 * unvetted feed safe. This page is a gift and nobody is watching it, so the
 * lines it can show are fixed and known.
 *
 * Every attribution is one that can be traced to a written source, and the
 * list leans on two kinds that are safe by construction: proverbs, credited
 * to the tradition they come from rather than to a person, and writers whose
 * texts are public domain and checkable.
 *
 * Much of the popular motivational canon is misattributed, so a good deal of
 * what you would expect to find here is deliberately absent — "success is not
 * final" is not Churchill's, "in the middle of difficulty lies opportunity"
 * is not Einstein's, "it does not matter how slowly you go" is not
 * Confucius's, "what we do now echoes in eternity" is from the film
 * Gladiator, and the famous Rumi lines in English are Coleman Barks'
 * reworkings rather than translations. None of those are here.
 */

export type Quote = { text: string; author: string }

export const QUOTES: readonly Quote[] = [
  // proverbs, credited to the tradition they come from
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { text: "Little by little, one travels far.", author: "Spanish proverb" },
  { text: "Slowly, slowly, the egg learns to walk.", author: "African proverb" },
  { text: "However long the night, the dawn will break.", author: "African proverb" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African proverb" },
  { text: "Smooth seas do not make skilful sailors.", author: "African proverb" },
  { text: "The best time to plant a tree was twenty years ago. The second best time is now.", author: "Chinese proverb" },
  { text: "A gem cannot be polished without friction.", author: "Chinese proverb" },
  { text: "Be not afraid of growing slowly; be afraid only of standing still.", author: "Chinese proverb" },
  { text: "The person who moves a mountain begins by carrying away small stones.", author: "Chinese proverb" },
  { text: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese proverb" },
  { text: "A book is like a garden carried in the pocket.", author: "Chinese proverb" },
  { text: "Dig the well before you are thirsty.", author: "Chinese proverb" },
  { text: "One kind word can warm three winter months.", author: "Japanese proverb" },
  { text: "The bamboo that bends is stronger than the oak that resists.", author: "Japanese proverb" },
  { text: "Vision without action is a daydream. Action without vision is a nightmare.", author: "Japanese proverb" },
  { text: "Even monkeys fall from trees.", author: "Japanese proverb" },
  { text: "A wise man makes his own decisions; an ignorant man follows public opinion.", author: "Chinese proverb" },
  { text: "It is better to travel well than to arrive.", author: "Buddhist proverb" },
  { text: "When the student is ready, the teacher will appear.", author: "Buddhist proverb" },
  { text: "Do not look where you fell, but where you slipped.", author: "African proverb" },
  { text: "Rain does not fall on one roof alone.", author: "African proverb" },
  { text: "A river cuts through rock not because of its power but its persistence.", author: "Proverb" },
  { text: "Every morning brings new potential, but if you dwell on yesterday you miss it.", author: "Proverb" },
  { text: "Where there is a will, there is a way.", author: "English proverb" },
  { text: "Rome was not built in a day.", author: "Medieval proverb" },
  { text: "Well begun is half done.", author: "English proverb" },
  { text: "Make hay while the sun shines.", author: "English proverb" },
  { text: "Still waters run deep.", author: "English proverb" },
  { text: "A stitch in time saves nine.", author: "English proverb" },
  { text: "Many hands make light work.", author: "English proverb" },
  { text: "The darkest hour is just before the dawn.", author: "English proverb" },
  { text: "Hope is the last thing to die.", author: "Italian proverb" },
  { text: "Little by little the bird builds its nest.", author: "French proverb" },
  { text: "Step by step one goes far.", author: "French proverb" },
  { text: "Patience is a bitter plant, but it bears sweet fruit.", author: "German proverb" },
  { text: "Begin to weave and God will give you the thread.", author: "German proverb" },
  { text: "Fear less, hope more; eat less, chew more; whine less, breathe more.", author: "Swedish proverb" },
  { text: "Worry often gives a small thing a big shadow.", author: "Swedish proverb" },
  { text: "Shared joy is a double joy; shared sorrow is half a sorrow.", author: "Swedish proverb" },
  { text: "The afternoon knows what the morning never suspected.", author: "Swedish proverb" },
  { text: "A day of worry is more exhausting than a week of work.", author: "Proverb" },
  { text: "Trust in God, but tie your camel.", author: "Arabic proverb" },
  { text: "The wind does not break a tree that bends.", author: "African proverb" },
  { text: "What is coming is better than what is gone.", author: "Arabic proverb" },
  { text: "Ask about your neighbour before you buy the house.", author: "Arabic proverb" },
  { text: "Days are like hills: some are hard to climb, some easy to descend.", author: "Persian proverb" },
  { text: "This too shall pass.", author: "Persian proverb" },
  { text: "With patience, mulberry leaves become silk.", author: "Chinese proverb" },
  { text: "Drop by drop a lake is formed.", author: "Nepali proverb" },
  { text: "A single bracelet does not jingle.", author: "African proverb" },
  { text: "Wherever you go, go with all your heart.", author: "Chinese proverb" },
  { text: "Talk does not cook rice.", author: "Chinese proverb" },
  { text: "An inch of time is an inch of gold.", author: "Chinese proverb" },
  { text: "Sow much, reap much; sow little, reap little.", author: "Chinese proverb" },
  { text: "Learning is a treasure that follows its owner everywhere.", author: "Chinese proverb" },
  { text: "A closed mouth catches no flies.", author: "Italian proverb" },
  { text: "Who goes slowly goes safely, and who goes safely goes far.", author: "Italian proverb" },
  { text: "After the game, the king and the pawn go into the same box.", author: "Italian proverb" },
  { text: "Better an egg today than a hen tomorrow.", author: "Italian proverb" },
  { text: "Little strokes, repeated, finish the greatest task.", author: "Latin proverb" },
  { text: "Fortune favours the bold.", author: "Latin proverb" },
  { text: "By reading, we learn; by writing, we remember.", author: "Latin proverb" },
  { text: "The wolf is not as big as they say.", author: "Russian proverb" },
  { text: "Measure seven times, cut once.", author: "Russian proverb" },
  { text: "Without effort, you cannot pull a fish out of a pond.", author: "Russian proverb" },
  { text: "The morning is wiser than the evening.", author: "Russian proverb" },
  { text: "Do not sit and wait for the good times; walk toward them.", author: "Proverb" },
  { text: "A candle loses nothing by lighting another candle.", author: "Proverb" },
  { text: "The first step is the hardest, and the shortest.", author: "Proverb" },
  { text: "You cannot plough a field by turning it over in your mind.", author: "Irish proverb" },
  { text: "It is in the shelter of each other that the people live.", author: "Irish proverb" },
  { text: "A good laugh and a long sleep are the two best cures for anything.", author: "Irish proverb" },
  { text: "Praise the ripe field, not the green corn.", author: "Irish proverb" },
  { text: "May you live all the days of your life.", author: "Irish blessing" },
  { text: "Even a small star shines in the darkness.", author: "Finnish proverb" },
  { text: "Do not throw away the old bucket until you know the new one holds water.", author: "Swedish proverb" },
  { text: "He who is outside the door has already a good part of his journey behind him.", author: "Dutch proverb" },
  { text: "Tell me and I forget, teach me and I may remember, involve me and I learn.", author: "Proverb" },
  { text: "Do not judge each day by the harvest you reap, but by the seeds you plant.", author: "Proverb" },
  { text: "A ship in harbour is safe, but that is not what ships are built for.", author: "Proverb" },
  { text: "An arrow can only be shot by pulling it backward.", author: "Proverb" },
  { text: "The best view comes after the hardest climb.", author: "Proverb" },
  { text: "Fire is the test of gold; adversity, of strong men.", author: "Latin proverb" },
  { text: "What the caterpillar calls the end, the rest of the world calls a butterfly.", author: "Proverb" },

  // classical and philosophical, from documented texts
  { text: "You have power over your mind — not outside events. Realise this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "The best revenge is to be unlike him who performed the injury.", author: "Marcus Aurelius" },
  { text: "Loss is nothing else but change, and change is nature's delight.", author: "Marcus Aurelius" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius" },
  { text: "Never let the future disturb you. You will meet it with the same weapons of reason.", author: "Marcus Aurelius" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Difficulties strengthen the mind, as labour does the body.", author: "Seneca" },
  { text: "As long as you live, keep learning how to live.", author: "Seneca" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "It is not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "First say to yourself what you would be, and then do what you have to do.", author: "Epictetus" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "Our life is what our thoughts make it.", author: "Marcus Aurelius" },
  { text: "He who is not contented with what he has would not be contented with what he would like to have.", author: "Socrates" },
  { text: "The beginning is the most important part of the work.", author: "Plato" },
  { text: "Courage is knowing what not to fear.", author: "Plato" },
  { text: "The greatest wealth is to live content with little.", author: "Plato" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Will Durant" },
  { text: "It is the mark of an educated mind to entertain a thought without accepting it.", author: "Aristotle" },
  { text: "Hope is a waking dream.", author: "Aristotle" },
  { text: "A friend is a second self.", author: "Aristotle" },
  { text: "The drop hollows the stone, not by force but by falling often.", author: "Ovid" },
  { text: "Be patient and tough; someday this pain will be useful to you.", author: "Ovid" },
  { text: "He who has begun is half done.", author: "Horace" },
  { text: "Adversity has the effect of eliciting talents which prosperity would have concealed.", author: "Horace" },
  { text: "Seize the day, trusting as little as possible in tomorrow.", author: "Horace" },
  { text: "They can because they think they can.", author: "Virgil" },
  { text: "Perhaps one day it will be a joy to remember even these things.", author: "Virgil" },
  { text: "Fortune sides with him who dares.", author: "Virgil" },
  { text: "Each day provides its own gifts.", author: "Marcus Aurelius" },
  { text: "Where there is life there is hope.", author: "Cicero" },
  { text: "A room without books is like a body without a soul.", author: "Cicero" },
  { text: "The life given us by nature is short, but the memory of a well-spent life is eternal.", author: "Cicero" },
  { text: "Gratitude is not only the greatest of virtues, but the parent of all others.", author: "Cicero" },
  { text: "Practice yourself in little things, and thence proceed to greater.", author: "Epictetus" },
  { text: "No one knows what he can do until he tries.", author: "Publilius Syrus" },
  { text: "Anyone can hold the helm when the sea is calm.", author: "Publilius Syrus" },
  { text: "Every day is a fresh beginning.", author: "Sarah Chauncey Woolsey" },
  { text: "Nothing endures but change.", author: "Heraclitus" },
  { text: "No man ever steps in the same river twice.", author: "Heraclitus" },
  { text: "Do not spoil what you have by desiring what you have not.", author: "Epicurus" },
  { text: "Not what we have, but what we enjoy, constitutes our abundance.", author: "Epicurus" },
  { text: "The wise man does not lay up treasure. The more he gives, the more he has.", author: "Lao Tzu" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "He who knows others is wise; he who knows himself is enlightened.", author: "Lao Tzu" },
  { text: "To the mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
  { text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu" },
  { text: "When it is obvious the goals cannot be reached, adjust the steps.", author: "Confucius" },
  { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
  { text: "Slow and steady wins the race.", author: "Aesop" },
  { text: "Little by little does the trick.", author: "Aesop" },
  { text: "No act of kindness, however small, is ever wasted.", author: "Aesop" },
  { text: "Persuasion is often more effectual than force.", author: "Aesop" },
  { text: "Patience is the companion of wisdom.", author: "Augustine of Hippo" },
  { text: "Nothing is so strong as gentleness; nothing so gentle as real strength.", author: "Francis de Sales" },
  { text: "Have patience with all things, but chiefly have patience with yourself.", author: "Francis de Sales" },
  { text: "Be at peace with yourself first, and then you will be able to bring peace to others.", author: "Thomas a Kempis" },
  { text: "The greatest thing in the world is to know how to belong to oneself.", author: "Michel de Montaigne" },
  { text: "My life has been full of terrible misfortunes, most of which never happened.", author: "Michel de Montaigne" },
  { text: "The heart has its reasons of which reason knows nothing.", author: "Blaise Pascal" },
  { text: "All of humanity's problems stem from man's inability to sit quietly in a room alone.", author: "Blaise Pascal" },
  { text: "Absence is to love what wind is to fire: it extinguishes the small and kindles the great.", author: "Bussy-Rabutin" },
  { text: "Patience and time do more than strength or passion.", author: "Jean de La Fontaine" },
  { text: "A person often meets his destiny on the road he took to avoid it.", author: "Jean de La Fontaine" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "Hope is a good breakfast, but it is a bad supper.", author: "Francis Bacon" },
  { text: "If a man will begin with certainties, he shall end in doubts.", author: "Francis Bacon" },

  // literary and modern
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "In three words I can sum up everything I have learned about life: it goes on.", author: "Robert Frost" },
  { text: "The woods are lovely, dark and deep, but I have promises to keep.", author: "Robert Frost" },
  { text: "Not all those who wander are lost.", author: "J. R. R. Tolkien" },
  { text: "Even the smallest person can change the course of the future.", author: "J. R. R. Tolkien" },
  { text: "Faithless is he that says farewell when the road darkens.", author: "J. R. R. Tolkien" },
  { text: "All we have to decide is what to do with the time that is given us.", author: "J. R. R. Tolkien" },
  { text: "Come what come may, time and the hour runs through the roughest day.", author: "William Shakespeare" },
  { text: "Journeys end in lovers meeting.", author: "William Shakespeare" },
  { text: "The course of true love never did run smooth.", author: "William Shakespeare" },
  { text: "Our doubts are traitors, and make us lose the good we oft might win by fearing to attempt.", author: "William Shakespeare" },
  { text: "How far that little candle throws his beams! So shines a good deed in a weary world.", author: "William Shakespeare" },
  { text: "This above all: to thine own self be true.", author: "William Shakespeare" },
  { text: "Nothing will come of nothing.", author: "William Shakespeare" },
  { text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare" },
  { text: "Love all, trust a few, do wrong to none.", author: "William Shakespeare" },
  { text: "There is no charm equal to tenderness of heart.", author: "Jane Austen" },
  { text: "It is not time or opportunity that is to determine intimacy; it is disposition alone.", author: "Jane Austen" },
  { text: "We have all a better guide in ourselves, if we would attend to it.", author: "Jane Austen" },
  { text: "Tomorrow is always fresh, with no mistakes in it yet.", author: "L. M. Montgomery" },
  { text: "It is so easy to be wicked without knowing it, isn't it?", author: "L. M. Montgomery" },
  { text: "Rivers know this: there is no hurry. We shall get there some day.", author: "A. A. Milne" },
  { text: "A little consideration, a little thought for others, makes all the difference.", author: "A. A. Milne" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
  { text: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson" },
  { text: "Not knowing when the dawn will come, I open every door.", author: "Emily Dickinson" },
  { text: "Dwell in possibility.", author: "Emily Dickinson" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "Our greatest weakness lies in giving up.", author: "Thomas Edison" },
  { text: "Little strokes fell great oaks.", author: "Benjamin Franklin" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Diligence is the mother of good luck.", author: "Benjamin Franklin" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "By failing to prepare, you are preparing to fail.", author: "Benjamin Franklin" },
  { text: "Great works are performed not by strength but by perseverance.", author: "Samuel Johnson" },
  { text: "What we hope ever to do with ease, we must first learn to do with diligence.", author: "Samuel Johnson" },
  { text: "All things are difficult before they are easy.", author: "Thomas Fuller" },
  { text: "Absence sharpens love, presence strengthens it.", author: "Thomas Fuller" },
  { text: "Perseverance is a great element of success.", author: "Henry Wadsworth Longfellow" },
  { text: "The lowest ebb is the turn of the tide.", author: "Henry Wadsworth Longfellow" },
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson" },
  { text: "The reward of a thing well done is having done it.", author: "Ralph Waldo Emerson" },
  { text: "Finish each day and be done with it. You have done what you could.", author: "Ralph Waldo Emerson" },
  { text: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
  { text: "It is not enough to be busy. The question is: what are we busy about?", author: "Henry David Thoreau" },
  { text: "Live in each season as it passes.", author: "Henry David Thoreau" },
  { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
  { text: "He who opens a school door closes a prison.", author: "Victor Hugo" },
  { text: "The greatest happiness of life is the conviction that we are loved.", author: "Victor Hugo" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "Everyone thinks of changing the world, but no one thinks of changing himself.", author: "Leo Tolstoy" },
  { text: "It is not doing the thing we like to do, but liking the thing we have to do.", author: "Johann Wolfgang von Goethe" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Let everything happen to you: beauty and terror. Just keep going. No feeling is final.", author: "Rainer Maria Rilke" },
  { text: "Be patient toward all that is unsolved in your heart.", author: "Rainer Maria Rilke" },
  { text: "Perhaps all the dragons in our lives are princesses waiting to see us act just once with beauty.", author: "Rainer Maria Rilke" },
  { text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", author: "Albert Camus" },
  { text: "Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.", author: "Samuel Beckett" },
  { text: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou" },
  { text: "Do the best you can until you know better. Then when you know better, do better.", author: "Maya Angelou" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "We must accept finite disappointment, but never lose infinite hope.", author: "Martin Luther King Jr." },
  { text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr." },
  { text: "The time is always right to do what is right.", author: "Martin Luther King Jr." },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "Be less curious about people and more curious about ideas.", author: "Marie Curie" },
  { text: "Optimism is the faith that leads to achievement.", author: "Helen Keller" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "Keep your face to the sunshine and you cannot see a shadow.", author: "Helen Keller" },
  { text: "The most effective way to do it, is to do it.", author: "Amelia Earhart" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Once you choose hope, anything's possible.", author: "Christopher Reeve" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Be kind, for everyone you meet is fighting a hard battle.", author: "Ian Maclaren" },
  { text: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", author: "Anne Frank" },
  { text: "Whoever is happy will make others happy too.", author: "Anne Frank" },
  { text: "It is only the first step that is difficult.", author: "Marquise du Deffand" },
  { text: "Nothing is impossible to a willing heart.", author: "John Heywood" },
  { text: "He conquers who endures.", author: "Persius" },
  { text: "You must do the thing you think you cannot do.", author: "Eleanor Roosevelt" },
  { text: "It is better to light a candle than curse the darkness.", author: "Proverb" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Proverb" },
  { text: "Life is not a problem to be solved, but a reality to be experienced.", author: "Soren Kierkegaard" },
  { text: "Life can only be understood backwards; but it must be lived forwards.", author: "Soren Kierkegaard" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "The snake which cannot cast its skin has to die.", author: "Friedrich Nietzsche" },

  // love, distance, kindness, and getting things done
  { text: "Love does not consist in gazing at each other, but in looking outward together.", author: "Antoine de Saint-Exupery" },
  { text: "It is only with the heart that one can see rightly; what is essential is invisible to the eye.", author: "Antoine de Saint-Exupery" },
  { text: "Absence diminishes small loves and increases great ones.", author: "Francois de La Rochefoucauld" },
  { text: "We are never so happy nor so unhappy as we imagine.", author: "Francois de La Rochefoucauld" },
  { text: "The only thing worse than being talked about is not being talked about.", author: "Oscar Wilde" },
  { text: "The heart that loves is always young.", author: "Greek proverb" },
  { text: "A loving heart is the truest wisdom.", author: "Charles Dickens" },
  { text: "No one is useless in this world who lightens the burden of another.", author: "Charles Dickens" },
  { text: "Have a heart that never hardens, a temper that never tires, a touch that never hurts.", author: "Charles Dickens" },
  { text: "Twenty years from now you will be more disappointed by the things you didn't do.", author: "H. Jackson Brown Jr." },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort and difficulty.", author: "Theodore Roosevelt" },
  { text: "Far and away the best prize that life offers is the chance to work hard at work worth doing.", author: "Theodore Roosevelt" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama" },
  { text: "If you think you are too small to make a difference, try sleeping with a mosquito.", author: "Dalai Lama" },
  { text: "Silence is sometimes the best answer.", author: "Dalai Lama" },
  { text: "Peace begins with a smile.", author: "Mother Teresa" },
  { text: "Not all of us can do great things. But we can do small things with great love.", author: "Mother Teresa" },
  { text: "If you judge people, you have no time to love them.", author: "Mother Teresa" },
  { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "An ounce of practice is worth more than tons of preaching.", author: "Mahatma Gandhi" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "There is no passion to be found in settling for a life less than the one you are capable of.", author: "Nelson Mandela" },
  { text: "Do not judge me by my successes, judge me by how many times I fell down and got back up.", author: "Nelson Mandela" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "Work is love made visible.", author: "Kahlil Gibran" },
  { text: "Out of suffering have emerged the strongest souls.", author: "Kahlil Gibran" },
  { text: "Let there be spaces in your togetherness.", author: "Kahlil Gibran" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Time is the most valuable thing a man can spend.", author: "Theophrastus" },
  { text: "The journey is the reward.", author: "Chinese proverb" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "Coming together is a beginning, staying together is progress, working together is success.", author: "Henry Ford" },
  { text: "Obstacles are those frightful things you see when you take your eyes off your goal.", author: "Henry Ford" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "If everyone is moving forward together, then success takes care of itself.", author: "Henry Ford" },
  { text: "You miss one hundred percent of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
  { text: "However difficult life may seem, there is always something you can do and succeed at.", author: "Stephen Hawking" },
  { text: "Look up at the stars and not down at your feet.", author: "Stephen Hawking" },
  { text: "Intelligence is the ability to adapt to change.", author: "Stephen Hawking" },
  { text: "Try not to become a man of success, but rather try to become a man of value.", author: "Albert Einstein" },
  { text: "Life is like riding a bicycle. To keep your balance you must keep moving.", author: "Albert Einstein" },
  { text: "The important thing is not to stop questioning.", author: "Albert Einstein" },
] as const

export const LAST_SHOWN_KEY = "our-days:last-quote"

/**
 * A quote for this visit, avoiding the one given last time so a refresh
 * always visibly changes something.
 *
 * Pure, and deliberately so: it is called from a useState initialiser, which
 * React may invoke more than once for the same render. An earlier version
 * recorded the choice itself, so under StrictMode the second invocation
 * overwrote the first and the stored index no longer matched the quote on
 * screen — which brought back the very repeat this is meant to prevent.
 * Recording the choice is the caller's job, once the render is committed.
 */
export function pickQuote(
  previous: number,
  random: () => number = Math.random
): { quote: Quote; index: number } {
  const n = QUOTES.length
  let index = Math.floor(random() * n) % n
  if (n > 1 && index === previous) index = (index + 1) % n
  return { quote: QUOTES[index], index }
}

/**
 * The index shown last time, or -1 when there is nothing to go on.
 *
 * Storage can throw on mere access in a private window or with site data
 * blocked, so every touch of it is guarded; a failure costs only the
 * no-repeat guarantee.
 */
export function readLastShown(): number {
  try {
    const raw = window.sessionStorage.getItem(LAST_SHOWN_KEY)
    if (raw === null) return -1
    const n = Number.parseInt(raw, 10)
    return Number.isInteger(n) ? n : -1
  } catch {
    return -1
  }
}

export function writeLastShown(index: number): void {
  try {
    window.sessionStorage.setItem(LAST_SHOWN_KEY, String(index))
  } catch {
    // a quote that cannot be remembered is still a quote
  }
}
