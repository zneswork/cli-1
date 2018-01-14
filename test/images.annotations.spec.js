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
      head: ['Image Name', "Tags", "Annotations"], colWidths: [50, 80, 80]
    });
  let draw = (image)=>{

   table.push([image.imageDisplayName, JSON.stringify(image.tags), image.annotations]);

  }

  it('get image annotation', (done)=>{
    let imageStream = kefir.fromPromise(Images.getAll({})).flatten().take(1000)
  //  kefir.sequentially(1000, [{internalImageId:"9dd8b5a1f0a931cab42d226ae849ba817d35861c4843cc80d5f52f42f2fb0eda"}])
    .flatMap((image)=>{
      if (!image.internalImageId)
       return kefir.constantError(image);
      return kefir.fromPromise(Images.getImageAnnotations(image.internalImageId)).map((annotations)=>{
        let id = image.internalImageId;
        let ret = {};
        _.set(ret, id, annotations);
        return ret;
      })

    }).log().onEnd(done, done);
  })

  it.only('getImageByTag', (done)=>{
   let imageStream = kefir.fromPromise(Images.getAll({}))
   let annotations = imageStream.flatten().take(10).flatMap((i)=>{
          if (!i.internalImageId) return kefir.constant(i);
          return kefir.fromPromise(Images.getImageAnnotations(i.internalImageId)).map((annotations)=>{
            _.set(i, "annotations"  ,  annotations);
            return i;
    })
  }).log('images->')

 annotations.log('images->').scan((prev, image)=>{
     prev.push( _.pick(image, ["imageDisplayName", "tags", "annotations"]));
     return prev;
 },[]).map((images)=>{
     let result =
     _.chain(images)
      .map((image)=>{
         let i =  _.pick(image, ["imageDisplayName", "tags", "annotations"]);
         return i;})
      .groupBy((image)=>image.imageDisplayName).value();
      _.map(result , (image)=>{
        draw({imageDisplayName:_.first(image).imageDisplayName
          , tags :_.map(image, (i)=>_.get(i, "tags[0].tag", "")).join(' ')
          ,annotations :_.map(image, (i)=>{
           let annotations =   _.get(i, "annotations", {});
            let ret  = [];
            _.forIn(annotations, (value, key)=>{
             ret.push(key + "=" +   value );
          })
          let r =   ret.join('\n')
          console.log(r);
          return r;
        })
        });
        return image;
     });
     return  result;
   }).takeErrors(1).onEnd(()=>{
     console.log(table.toString());
     done();
   });



 })
})
