var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const grayMatter = require(`gray-matter`);
const crypto = require(`crypto`);
const _ = require(`lodash`);

module.exports = async function onCreateNode({
  node,
  getNode,
  loadNodeContent,
  boundActionCreators
}) {
  const { createNode, createParentChildLink } = boundActionCreators;

  // We only care about whoa content, but we'll support markdown too I guess.
  if (node.internal.mediaType !== `text/markdown` && node.internal.mediaType !== `text/x-markdown` && node.extension !== 'whoa') {
    return;
  }

  const content = await loadNodeContent(node);
  let data = grayMatter(content);

  // Convert date objects to string. Otherwise there's type mismatches
  // during inference as some dates are strings and others date objects.
  if (data.data) {
    data.data = _.mapValues(data.data, v => {
      if (_.isDate(v)) {
        return v.toJSON();
      } else {
        return v;
      }
    });
  }

  const contentDigest = crypto.createHash(`md5`).update(JSON.stringify(data)).digest(`hex`);
  const markdownNode = {
    id: `${node.id} >>> Whoa`,
    children: [],
    parent: node.id,
    internal: {
      content,
      contentDigest,
      type: `Whoa`
    }
  };

  markdownNode.frontmatter = _extends({
    title: `` }, data.data, {
    _PARENT: node.id,
    // TODO Depreciate this at v2 as much larger chance of conflicting with a
    // user supplied field.
    parent: node.id

    // Add path to the markdown file path
  });if (node.internal.type === `File`) {
    markdownNode.fileAbsolutePath = node.absolutePath;
  }

  createNode(markdownNode);
  createParentChildLink({ parent: node, child: markdownNode });
};