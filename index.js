import cacheFetch from "./fetch-cache.js";
import fetch from 'node-fetch';

const fetchCache = cacheFetch(fetch, {expiresIn: 3000});

console.log('Starting request 1');
fetchCache('https://jsonplaceholder.typicode.com/posts?_start=2&_limit=10').then((response) => {
    console.log(response.status);
    console.log('Starting request 2')
    fetchCache('https://jsonplaceholder.typicode.com/posts?_start=2&_limit=3').then(response => {
        console.log(response.status);
    })
})

console.log('Starting request 3');
fetchCache('https://jsonplaceholder.typicode.com/posts?_limit=3&_start=2').then((response) => {
    console.log(response.status);
    return response.json();
}).then(res => console.log(res));

console.log('Starting request 4');
fetchCache('https://jsonplaceholder.typicode.com/posts?_start=2&_limit=10', {
    headers: {
        'Accept': 'application/json'
    }
}).then(response => {
    console.log(response.status);
})