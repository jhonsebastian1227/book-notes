-- crear base de datos
CREATE DATABASE readbook;

-- crear tabla
CREATE TABLE book (
	id SERIAL PRIMARY KEY NOT NULL,
	user_name VARCHAR(100),
	cover_i VARCHAR(100),
	title TEXT UNIQUE,
	author_name VARCHAR(100),
	date_read VARCHAR(12),
	book_summary TEXT
);

-- añadir libro
INSERT INTO book (user_name, cover_i, title, author_name, date_read, book_summary)
VALUES ('Sebastian',
		'585083',
		'You Can Negotiate Anything',
	    'Herb Cohen',
	   	'2024-03-20',
		'Everything is negotiable. Challenge authority. You have the power in any situation. This is how to realize it and use it. A must-read classic from 1980 from a master negotiator. My notes here aren’t enough because the little book is filled with so many memorable stories — examples of great day-to-day moments of negotiation that will stick in your head for when you need them. (I especially loved the one about the power of the prisoner in solitary confinement.) So go buy and read the book. I’m giving it a 10/10 rating even though the second half of the book loses steam, because the first half is so crucial.'
);

-- seleccionar libros
SELECT * FROM book
ORDER BY id ASC

-- selecciona el libro a editar
SELECT * FROM book WHERE id = 5