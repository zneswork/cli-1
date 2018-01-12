const Images = require('../lib/logic/api/image');
const { auth }        = require('../lib/logic');
const _ = require('lodash');
const { JWTContext }  = auth.contexts;
const authManager     = auth.manager;
const kefir = require('kefir');

describe('image annotation',  async ()=>{
  debugger;
  const DEFAULTS = {
      URL: 'https://g.codefresh.io',
      CFCONFIG: `${process.env.HOME || process.env.USERPROFILE}/.cfconfig`,
      DEBUG_PATTERN: 'codefresh',
      GET_LIMIT_RESULTS: 25,
      GET_PAGINATED_PAGE: 1,
      CODEFRESH_REGISTRIES: ['r.cfcr.io'],
      WATCH_INTERVAL_MS: 3000,
      MAX_CONSECUTIVE_ERRORS_LIMIT: 10,
  };
  const authContextName = "ci";
  beforeEach(()=>{
       authManager.loadContexts(DEFAULTS.CFCONFIG);
       let context;
       (context = authManager.getContextByName(authContextName)) ? authManager.setCurrentContext(context) : throws ('missing context');



      //authManager.setCurrentContext(authContext);

      //authMAnager.then(done, done);
  })
  const Table = require('cli-table');
  var table = new Table({
      head: ['Image Name', "Tags"], colWidths: [50, 150]
    });
  let draw = (image)=>{

   table.push([image.imageDisplayName, JSON.stringify(image.tags)]);

  }
  it('annotate', (done)=>{
   let imageStream = kefir.fromPromise(Images.getAll({})).map((images)=>{
    let result =  _.chain(images).map((image)=>{
     let i =  _.pick(image, ["imageDisplayName", "tags", "annotations"]);
     return i;
   }).groupBy((image)=>image.imageDisplayName).value();
     _.map(result , (image)=>{
        draw({imageDisplayName:_.first(image).imageDisplayName, tags :_.map(image, (i)=>_.get(i, "tags[0].tag", "")).join(' ')});
        return image;
     });
     return  result;
   }).takeErrors(1).onEnd(()=>{
     console.log(table.toString());
     done();
   });



  })
})
