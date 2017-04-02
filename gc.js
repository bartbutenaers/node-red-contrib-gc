module.exports = function(RED) {
    "use strict";
    var gc = (require('gc-stats'))();

    function GarbageCollectionNode(config) {
        RED.nodes.createNode(this,config);
        this.minor = config.minor;
        this.major = config.major;
        this.incremental = config.incremental;
        this.weak = config.weak;
        this.all = config.all;
         
        var node = this;

        if ( !node.minor && !node.major ) {
            return this.error("To analyze garbage collections, either minor or major should be selected");
        }

        var statisticHandler = function (stats) {
            var topic = '';
            
            switch(stats.gctype) {
                case 1:
                    if (!node.minor) {
                        // Skip minor GC if not requested by the user
                        return null;
                    }
                    
                    topic = 'Minor';
                    break;
                case 2:
                    if (!node.major) {
                        // Skip major GC if not requested by the user
                        return null;
                    }
                    
                    topic = 'Major';
                    break;
                case 4:
                    if (!node.incremental) {
                        // Skip incremental GC if not requested by the user
                        return null;
                    }
                    
                    topic = 'Incremental';
                    break; 
                case 8:
                    if (!node.weak) {
                        // Skip weak GC if not requested by the user
                        return null;
                    }
                    
                    topic = 'Weak';
                    break;  
                case 8:
                    if (!node.all) {
                        // Skip all GC if not requested by the user
                        return null;
                    }
                    
                    topic = 'All';
                    break;                     
                default:
                    console.log('Garbage collection type ' + stats.gctype + ' is not supported by the gc node.');
                    return null;
            }
            
            // The received JSON structure contains following information:
            // GC happened {
            //    pause: 433034,
            //    pauseMS: 0,
            //    gctype: 1,
            //    before: {
            //        totalHeapSize: 18635008,
            //        totalHeapExecutableSize: 4194304,
            //        usedHeapSize: 12222496,
            //        heapSizeLimit: 1535115264
            //    }, after: {
            //        totalHeapSize: 18635008,
            //        totalHeapExecutableSize: 4194304,
            //        usedHeapSize: 8116600,
            //        heapSizeLimit: 1535115264
            //    }, diff: {
            //        totalHeapSize: 0,
            //        totalHeapExecutableSize: 0,
            //         usedHeapSize: -4105896,
            //        heapSizeLimit: 0
            //    }
            // }

            var msg = {payload: stats, topic: topic};
            node.send(msg);
        };
        gc.addListener('stats', statisticHandler);

        this.on("close", function() {
            // Remove the statistic handler function
            gc.removeListener('stats', statisticHandler);
        });
    }

    RED.nodes.registerType("gc",GarbageCollectionNode);
}
