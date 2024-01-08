// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    const hostUrl = 'http://book-elb-321-525691222.us-east-1.elb.amazonaws.com:3000';
    // const hostUrl = 'http://localhost:3001';
    const appContainer = document.getElementById('app');
    let authToken = localStorage.getItem('authToken');
    let tokenExpiresAt = localStorage.getItem('tokenExpiresAt');

    if (!authToken || tokenExpiresAt < Date.now()) {
        showSignupPage();
    } else {
        showUserPage();
    }

    function showSignupPage() {
        appContainer.innerHTML = document.getElementById('signup-container').innerHTML;
        const signupForm = document.getElementById('signup-form');
        const goToLoginLink = document.getElementById('goToLoginButton');

        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${hostUrl}/api/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('tokenExpiresAt', data.expiresAt);
                    authToken = data.token;
                    tokenExpiresAt = data.expiresAt;
                    showUserPage();
                } else {
                    // Handle signup error
                    console.error('Signup failed');
                    alert(data?.error?.message);
                }
            } catch (error) {
                console.error('Error during signup:', error);
            }
        });

        // Add an event listener for the "Go to Login" link
        goToLoginLink.addEventListener('click', () => {
            showLoginPage();
        });
    }

    function showLoginPage() {
        appContainer.innerHTML = document.getElementById('login-container').innerHTML;
        const loginForm = document.getElementById('login-form');

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${hostUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('tokenExpiresAt', data.expiresAt);
                    authToken = data.token;
                    tokenExpiresAt = data.expiresAt;
                    showUserPage();
                } else {
                    // Handle signup error
                    console.error('Login failed');
                    alert(data?.error?.message);
                }
            } catch (error) {
                console.error('Error during login:', error);
            }
        });
    }

    function showUserPage() {
        appContainer.innerHTML = document.getElementById('user-container').innerHTML;
        const userBooksContainer = document.getElementById('user-books');
        const publishButton = document.getElementById('publish-button');
        const seeAllPublishedButton = document.getElementById('see-all-published-button');
        const logoutButton = document.getElementById('logout-button');

        if (tokenExpiresAt < Date.now()) {
            showLoginPage();
            alert("Session expired!")
        }

        fetch(`${hostUrl}/api/books/user`, {
            headers: {
                Authorization: `${authToken}`
            }
        })
            .then((response) => response.json())
            .then((data) => {
                // Display user's books
                userBooksContainer.innerHTML = generateBookListHTML(data.items);

                const unpublishButtons = document.querySelectorAll('.unpublish-btn');
                // Attach event listeners to unpublish buttons
                unpublishButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        const bookId = button.dataset.bookId;
                        const title = button.dataset.title;
                        unpublishBook(bookId, title);
                    });
                });
            })
            .catch((error) => {
                console.error('Error fetching user books:', error);
            });

        publishButton.addEventListener('click', () => {
            // Show the contents of the "Publish" page
            showPublishPage();
        });

        seeAllPublishedButton.addEventListener('click', () => {
            // Show the contents of the "See All Published" page
            showAllPublishedBooks();
        });

        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('tokenExpiresAt');
            showLoginPage();
            alert("You are logged out!");
        });
    }

    function showPublishPage() {
        appContainer.innerHTML = document.getElementById('publish-container').innerHTML;
        const publishForm = document.getElementById('publish-form');

        publishForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const title = document.getElementById('title').value;
            const author = document.getElementById('author').value;
            const genre = document.getElementById('genre').value;
            const description = document.getElementById('description').value;
            const language = document.getElementById('language').value;

            if (tokenExpiresAt < Date.now()) {
                showLoginPage();
                alert("Session expired!")
            }

            try {
                const response = await fetch(`${hostUrl}/api/books/publish`, {
                    method: 'POST',
                    headers: {
                        Authorization: `${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title, author, genre, description, language })
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Book published successfully!");
                    showUserPage();
                } else {
                    console.error('Signup failed');
                    alert(data?.error?.message);
                }
            } catch (error) {
                console.error('Error during signup:', error);
            }
        });

        // Add an event listener for the "Go to Login" link
        goToLoginLink.addEventListener('click', () => {
            showLoginPage();
        });
    }

    function showAllPublishedBooks(lastEvaluatedKey = null) {
        appContainer.innerHTML = document.getElementById('published-container').innerHTML;
        const publishedBooksContainer = document.getElementById('published-books');
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        searchButton.addEventListener('click', () => {
            const searchQuery = searchInput.value.trim();
            if (!searchQuery || searchQuery == '') {
                alert("Please enter a book name to search!");
            } else {
                searchBooks(searchQuery);
            }
        });
        try {
            const pageSize = 2;
            let queryString = `page_size=${pageSize}`;
            if (lastEvaluatedKey) {
                queryString += `&last_evaluated_key=${lastEvaluatedKey}`
            }

            if (tokenExpiresAt < Date.now()) {
                showLoginPage();
                alert("Session expired!")
            }

            fetch(`${hostUrl}/api/books/published?${queryString}`, {
                method: 'GET',
                headers: {
                    Authorization: `${authToken}`,
                    'Content-Type': 'application/json',
                }
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.items.length) {
                        const loadMoreButton = document.getElementById('load-more');
                        if (data.lastEvaluatedKey) {
                            loadMoreButton.style.display = "block";
                            loadMoreButton.addEventListener('click', () => {
                                showAllPublishedBooks(data.lastEvaluatedKey);
                            });
                        }
                    }
                    publishedBooksContainer.innerHTML = generatePublishedBookListHTML(data.items);
                })
                .catch((error) => {
                    console.error('Error fetching user books:', error);
                });
        } catch (error) {
            console.error('Error during signup:', error);
        }
    }

    function searchBooks(searchQuery) {
        if (tokenExpiresAt < Date.now()) {
            showLoginPage();
            alert("Session expired!")
        }
        fetch(`${hostUrl}/api/books/search?title=${searchQuery}`, {
            headers: {
                Authorization: `${authToken}`
            }
        })
            .then((response) => response.json())
            .then((data) => {
                document.getElementById('published-books-page-header').innerHTML = `Search results for '${searchQuery}'`;
                document.getElementById('load-more').style.display = "none"
                const searchReultsContainer = document.getElementById('published-books');
                searchReultsContainer.innerHTML = generatePublishedBookListHTML(data.items);
            })
            .catch((error) => {
                console.error('Error fetching user books:', error);
            });
    }

    function generateBookListHTML(books) {
        if (!books || books.length === 0) {
            return '<p>No books available.</p>';
        }

        const tableHeader = `
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Description</th>
              <th>Language</th>
              <th>Published By</th>
              <th>Published On</th>
            </tr>
          </thead>
        `;

        const tableRows = books.map((book) => `
          <tr>
            <td>${book.book_id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td>${book.description}</td>
            <td>${book.language}</td>
            <td>${book.published_by}</td>
            <td>${book.publication_date}</td>
            <td>
              <button class="unpublish-btn" data-book-id="${book.book_id}" data-title="${book.title}">Unpublish</button>
            </td>
          </tr>
        `).join('');

        return `
          <table>
            ${tableHeader}
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        `;
    }

    function generatePublishedBookListHTML(books) {
        if (!books || books.length === 0) {
            return '<p>No published books available.</p>';
        }

        const tableHeader = `
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Description</th>
              <th>Language</th>
              <th>Published By</th>
              <th>Published On</th>
            </tr>
          </thead>
        `;

        const tableRows = books.map((book) => `
          <tr>
            <td>${book.book_id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td>${book.description}</td>
            <td>${book.language}</td>
            <td>${book.published_by}</td>
            <td>${book.publication_date}</td>
          </tr>
        `).join('');

        return `
          <table>
            ${tableHeader}
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        `;
    }

    function unpublishBook(bookId, title) {
        if (tokenExpiresAt < Date.now()) {
            showLoginPage();
            alert("Session expired!")
        }
        fetch(`${hostUrl}/api/books/unpublish/${bookId}`, {
            method: 'PUT',
            headers: {
                Authorization: `${authToken}`,
            },
        }).then(() => {
            alert(`Unpublished book ${title}`);
            showUserPage();
        }).catch((error) => {
            alert(`Error unpublishing book :: ${error.message}`);
        });
    }

});
