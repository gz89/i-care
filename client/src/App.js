import React, { useState, useEffect } from 'react';
import lunr from 'lunr';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useDebounce from './use-debounce';

import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [documents, setDocuments] = useState(null);
  const [idx, setIdx] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadedAll, setIsLoadedAll] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setSearchResults(data);
        InitIdx(data);
        var documents = data.reduce(function (memo, doc) {
          memo[doc.id] = doc;
          return memo;
        }, {});
        setDocuments(documents);
      });
  }, []);

  useEffect(() => {
    setIsLoadedAll(false);
    if (idx && documents) {
      const results = idx.search(debouncedQuery);
      let documentArray = [];
      results.forEach((result) => {
        let document = documents[result.ref];
        documentArray.push(document);
      });
      setSearchResults(documentArray);
    }
  }, [idx, debouncedQuery, documents]);

  const InitIdx = (posts) => {
    var idx = lunr(function () {
      this.ref('id');
      this.field('question');
      this.field('answer');

      posts.forEach(function (doc) {
        this.add(doc);
      }, this);
    });
    setIdx(idx);
  };

  return (
    <div className='App'>
      <input
        type='text'
        name='query'
        placeholder='Search'
        autoComplete='off'
        className='search-input'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className='answer-lists'>
        {searchResults.length === 0 ? (
          <h2 className='question'>No result, try another query</h2>
        ) : (
          <>
            {isLoadedAll ? (
              <>
                {searchResults.map((post) => (
                  <Item post={post} key={post.id} />
                ))}
              </>
            ) : (
              <>
                {searchResults.slice(0, 5).map((post) => (
                  <Item post={post} key={post.id} />
                ))}
              </>
            )}
            {!isLoadedAll && (
              <button onClick={() => setIsLoadedAll(true)}>Load All</button>
            )}
          </>
        )}
      </ul>
    </div>
  );
}
const renderers = {
  code: ({ value }) => {
    return (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language='javascript'
        children={value}
      />
    );
  },
};

const Item = React.memo(({ post }) => {
  return (
    <li className='answer-list-item'>
      <h2 className='question'>{post.question}</h2>
      <ReactMarkdown
        renderers={renderers}
        className='answer'
        children={post.answer}
      />
    </li>
  );
});

export default App;
