import { LightningElement, track, wire } from 'lwc';
import PROFILE_CHANNEL from '@salesforce/messageChannel/ProfileChannel__c';
import { publish,subscribe, MessageContext } from 'lightning/messageService';
import getUsersByLicenseId from '@salesforce/apex/ProfileManagement.getUsersByLicenseId';
import getProfilesByLicenseId from '@salesforce/apex/ProfileManagement.getProfilesByLicenseId';
import AK from 'c/handleApiValues';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class UsersTable extends LightningElement 
{
    _nextButtonStatus = false;
    get nextButtonStatus(){
        let counter = 0;
        if(this._changedData.length > 0)
        {
            this._changedData.forEach(element => {
                if(element.duration !== 'None')
                    counter++;
            });
        }
        if(counter !== this._changedData.length || counter === 0)
            return true;
        else if(counter === this._changedData.length)
            return false;    
    }

    _clonnedMainData = [];

    @track _allProfilesData = [];
    get allProfilesData()
    {
        return JSON.stringify(this._allProfilesData);
    }

    _finalData = [];
    get finalData()
    {
        return JSON.stringify(this._finalData);
    }

    value = 'None';

    get options() {
        return [
            { label: 'None', value: 'None' },
            { label: '3 Hours', value: '3h' },
            { label: '6 Hours', value: '6h' },
            { label: '24 Hours', value: '24h' },
        ];
    }

    handleChange(event) {
        //alert(event.target.name + ' ' + event.detail.value);
        this.value = event.detail.value;
        if(this.value !== 'None')
        {
            const rec = this._changedData.find(row => (row.uid.toString() === event.target.name.toString()));
            rec.duration = this.value;
            const row = this._data.find(row => (row.id.toString() === event.target.name.toString()));
            row.duration = this.value;
            row.disabled = false;
            this._data = this._data.filter(row => {
                return row;
            });
            // const payload = { finalData : this._changedData };
            // publish(this.messageContext,PROFILE_CHANNEL,payload);
        }
        else
        {
            const rec = this._changedData.find(row => (row.uid.toString() === event.target.name.toString()));
            rec.duration = this.value;
            //this._changedData = this._changedData.filter(row => (row.uid.toString() !== event.target.name.toString()));
            const row = this._data.find(row => (row.id.toString() === event.target.name.toString()));
            row.duration = this.value;
            row.disabled = true;
            this._data = this._data.filter(row => {
                return row;
            });
            this._changedData = this._changedData.filter(row => {
                return row;
            });
        }
    }

    handleEditDuration(e){
        e.preventDefault();
        const checkRecData = this._changedData.find(row => (row.uid.toString() === e.currentTarget.dataset.id.toString()));
        if(checkRecData)
        {
            const rec = this._data.find(row => (row.id.toString() === e.currentTarget.dataset.id.toString()));
            rec.editDuration = true;
            this._data = this._data.filter(row => {
                return row;
            });
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title : 'Alert!',
                    message : 'First Select Profile then come here.',
                    variant: 'error'
                }),
            );
        }
    }

    _changedData = [];
    get changedData()
    {
        return JSON.stringify(this._changedData);
    }

    @track hasData = false;

    _leftText = '';
    get leftText(){
        return this._leftText;
    }

    _columns = new AK().columns();
    get columns(){
        return this._columns;
    }

    _data = [];
    get data(){
        return this._data;
    }

    _subscription = null;

    @wire(MessageContext)
    messageContext;

    @track hasCatchedValue = false;
    _catchedValue = '';
    get catchedValue()
    {
        return this._catchedValue;
    }

    connectedCallback()
    {
        if(!this._subscription)
        {
            this._subscription = subscribe(
                this.messageContext ,
                PROFILE_CHANNEL,
                (payload) => this.handleCatchedValue(payload)
            );
        }
    }

    handleCatchedValue(payload)
    {
        this._catchedValue = payload.recordId;
        if(this._catchedValue === 'None')
        {
            this.hasCatchedValue = false;
            return;
        }
        this._leftText = 'UserLicenseId';
        this.hasCatchedValue = true;
        getUsersByLicenseId({licenseId : this._catchedValue}).then(result => {
            this._data = result.map(row => {
                return {
                    id : row.Id,
                    uname : row.Name ,
                    pname : row.Profile.Name ,
                    pid : row.ProfileId,
                    duration : '',
                    isEdit : false ,
                    disabled : true ,
                    editDuration : false,
                    isRowDisabled : false
                };
            });
            this._clonnedMainData = [...this._data];
            this.hasData = true;
        }).catch(error => {

        });
        getProfilesByLicenseId({licenseId : this._catchedValue}).then(result => {
            this._allProfilesData = result;
        }).catch(error => {

        });
    }

    handleEditProfile(e)
    {
        //alert(e.currentTarget.dataset.id);
        const rec = this._data.find(row => (row.id.toString() === e.currentTarget.dataset.id.toString()));
        rec.isEdit = true;
        this._data = this._data.filter(row => {
            return row;
        });
        //alert(`is Profile Edit Clicked.`);
    }
    handleSave(e)
    {
        //const a = this.querySelector('c-reusable-combobox-component');
        //alert('Save Called.' + e.target.name);
        // const dataRow = this._data.find(row => (row.id.toString() === e.target.name.toString()));
        // if(dataRow){
        //     dataRow.isRowDisabled = true;
        //     this._data = this._data.filter(row => {
        //         return row;
        //     });
        // }
        // const rec = this._changedData.find(row => (row.uid.toString() === e.target.name.toString()));
        // this._finalData.push(rec);
        // this._finalData = this._finalData.filter(row => {
        //     return row;
        // });
        // this._changedData = this._changedData.filter(row => (row.uid.toString() !== e.target.name.toString()));

    }
    handleNext(){
        const payload = { isVisible : false , finalData : this._changedData };
        publish(this.messageContext,PROFILE_CHANNEL,payload);
    }
    handleOnSelect(e){
        //alert(`Selected User ${e.detail.userId} And Selected Profile is ${e.detail.newProfileId}`);
        if(e.detail.newProfileId.toString() !== 'None')
        {
            // const row = this._data.find(row => (row.id.toString() === e.detail.userId.toString()));
            // row.disabled = false;
            // this._data = this._data.filter(row => {
            //     return row;
            // });
            const existingRow = this._changedData.find(row => (row.uid.toString() === e.detail.userId.toString()));
            if(existingRow)
            {
                existingRow.pid = e.detail.newProfileId;
            }
            else{
                this._changedData.push(
                    {
                        uid : e.detail.userId , 
                        pid : e.detail.newProfileId , 
                        duration : 'None',
                        uname : this._data.find(row => (row.id.toString() === e.detail.userId.toString())).uname,
                        pname : this._allProfilesData.find(row => (row.Id.toString() === e.detail.newProfileId.toString())).Name
                    }
                );
                this._changedData = this._changedData.filter(row => {
                    return row;
                });
            }
        }
        else{
            const row = this._data.find(row => (row.id.toString() === e.detail.userId.toString()));
            row.disabled = true;
            row.editDuration = false;
            this._data = this._data.filter(row => {
                return row;
            });
            this._changedData = this._changedData.filter(row => {
                if(row.uid.toString() !== e.detail.userId.toString())
                {
                    return row;
                }
            });
        }
    }
}