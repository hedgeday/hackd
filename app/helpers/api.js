import config from '../config/default';
import cheerio from 'cheerio-without-node-native';

/**
 * Get item from given ID
 * @param  {String} [itemId] The ID of the item to fetch
 * @return {Promise}         Returns a promise
 */
getItem = (itemId) => {
  return new Promise((resolve, reject) => {
    fetch(`${config.api}/item/${itemId}.json`)
      .then(response => response.json())
      .then(responseJson => {
        console.log(responseJson);
        resolve(responseJson);
      }).catch(error => {
        console.error(error);
        reject(error);
      });
  });
};

/**
 * Given a list of IDs, get each item for that ID
 * @param  {Array} [items] An array of item IDs
 * @return {Promise[]}     An array of Promises resolved
 *                         with Promise.all
 */
getItems = (page, limit, items) => {
  const beginning = 0;
  const end = 20 + 1;
  const slicedItems = items.slice(beginning, end);

  // Map each itemId to an Array of Promises
  let posts = slicedItems.map(item => {
    return getItem(item)
      .then(post => {
        return post;
      })
  });

  return posts;
};

/**
 * Get the URL needed to upvote
 * @param  {String} [itemId] The item ID to upvote
 * @return {Promise}         Returns a promise that
 *                           resolves with the upvote URL
 */
getUpvoteUrl = (itemId) => {
  return fetch(`${config.base}/item?id=${itemId}`, {
    mode: "no-cors",
    credentials: "include",
  }).then(response => response.text())
    .then(responseText => {
      const document = cheerio.load(responseText);
      return document(`#up_${itemId}`).attr("href");
    });
};

/**
 * Upvote an item
 * @param  {String} [itemId] The item ID to upvote
 * @return {Promise}         Returns a promise that
 *                           resolves true if upvoted, else false
 */
upvote = (itemId) => {
  return this.getUpvoteUrl(itemId)
    .then(upvoteUrl => fetch(`${config.base}/${upvoteUrl}`, {
      mode: "no-cors",
      credentials: "include",
    })).then(response => response.text())
      .then(responseText => {
        return true;
      }).catch(error => {
        console.error(error);
        return false;
      });
};

/**
 * Login a user
 * @param  {String} [username] The users username
 * @param  {String} [password] The users password
 * @return {Promise}           Returns a promise that
 *                             resolves true if logged in, else false
 */
login = (username, password) => {
  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
    "Access-Control-Allow-Origin": "*",
  });

  return fetch(`${config.base}/login`, {
    method: "POST",
    headers: headers,
    body: `acct=${username}&pw=${password}&goto=news`,
    mode: "no-cors",
    credentials: "include",
  }).then(response => response.text())
    .then(responseText => {
      if (responseText.match(/Bad Login/i)) {
        return false;
      } else {
        return true;
      }
    });
};

/**
 * Get the URL needed to comment
 * @param  {String} [itemId] The item ID to comment on
 * @return {Promise}         Returns a promise that
 *                           resolves with the comment URL
 */
getCommentUrl = (itemId) => {
  return fetch(`${config.base}/item?id=${itemId}`, {
    mode: "no-cors",
    credentials: "include",
  }).then(response => response.text())
    .then(responseText => {
      const document = cheerio.load(responseText);
      return document("input[name=hmac]").attr("value");
   });
};

/**
 * Reply to a story or a comment
 * @param  {String} [itemId] The item ID to comment on
 * @param  {String} [reply]  The text content of the reply
 * @return {Promise}         Returns a promise that
 *                           resolves true if commented, else false
 */
comment = (itemId, reply) => {
  return this.getCommentUrl(itemId).then(commentUrl => {
    const headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
      "Access-Control-Allow-Origin": "*",
    });

    return fetch(`${config.base}/comment`, {
      method: "POST",
      headers: headers,
      body: `parent=${itemId}&goto=item?id=${itemId}&hmac=${commentUrl}&text=${reply}`,
      mode: 'no-cors',
      credentials: 'include'
    })
  }).then(response => response.text())
    .then(responseText => {
      return true;
    }).catch(error => {
      console.log(error);
      return false;
    });
};

export { 
  getItems,
  upvote,
  login,
  comment, 
};