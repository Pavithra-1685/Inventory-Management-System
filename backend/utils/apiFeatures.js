/**
 * Generic query builder for filtering, sorting, pagination, and search
 */
class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search(fields = []) {
    if (this.queryStr.search && fields.length > 0) {
      const escapedSearch = String(this.queryStr.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      const searchConditions = fields.map(field => ({ [field]: searchRegex }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryStr };
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludeFields.forEach(field => delete queryObj[field]);

    // Advanced filtering with operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|nin)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 20;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }

  count() {
    return this.query.model.countDocuments(this.query.getFilter());
  }
}

module.exports = APIFeatures;
